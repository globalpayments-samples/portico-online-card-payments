const { test, expect } = require('@playwright/test');
const testData = require('./test-data.json');
const { spawn } = require('child_process');
const fetch = require('node-fetch');
const path = require('path');

let server;

// Enhanced port checking with better error handling
async function isPortFree(port) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    const response = await fetch(`http://localhost:${port}`, { 
      signal: controller.signal,
      timeout: 2000 
    });
    clearTimeout(timeoutId);
    return false;
  } catch (error) {
    return true;
  }
}

// Improved process cleanup
async function forceKillPortProcesses(port) {
  return new Promise((resolve) => {
    try {
      // For different operating systems
      const isWindows = process.platform === 'win32';
      
      if (isWindows) {
        // Windows command to find and kill processes
        const netstat = spawn('netstat', ['-ano']);
        let output = '';
        
        netstat.stdout.on('data', (data) => {
          output += data.toString();
        });
        
        netstat.on('close', () => {
          const lines = output.split('\n');
          const portLine = lines.find(line => line.includes(`:${port} `));
          
          if (portLine) {
            const pid = portLine.trim().split(/\s+/).pop();
            if (pid && !isNaN(pid)) {
              try {
                spawn('taskkill', ['/F', '/PID', pid]);
              } catch (e) {
                console.log(`Could not kill process ${pid}:`, e.message);
              }
            }
          }
          resolve();
        });
      } else {
        // Unix/Linux/macOS
        const lsof = spawn('lsof', ['-ti', `tcp:${port}`]);
        let pids = '';
        
        lsof.stdout.on('data', (data) => {
          pids += data.toString();
        });
        
        lsof.on('close', (code) => {
          if (pids.trim()) {
            const pidList = pids.trim().split('\n');
            
            pidList.forEach(pid => {
              try {
                process.kill(parseInt(pid), 'SIGKILL');
                console.log(`Killed process ${pid} on port ${port}`);
              } catch (e) {
                console.log(`Could not kill process ${pid}:`, e.message);
              }
            });
          }
          resolve();
        });
      }
    } catch (error) {
      console.log('Error in forceKillPortProcesses:', error.message);
      resolve();
    }
  });
}

// Enhanced port waiting with better logging
async function waitForPortToFree(port, maxWait = 15000) {
  console.log(`Waiting for port ${port} to become free...`);
  const startTime = Date.now();
  let attempts = 0;
  
  while (Date.now() - startTime < maxWait) {
    attempts++;
    if (await isPortFree(port)) {
      console.log(`Port ${port} is free after ${attempts} attempts`);
      return true;
    }
    console.log(`Port ${port} still in use, attempt ${attempts}...`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`Port ${port} still not free, attempting force cleanup...`);
  await forceKillPortProcesses(port);
  
  // Wait a bit after force cleanup
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  if (await isPortFree(port)) {
    console.log(`Port ${port} freed after force cleanup`);
    return true;
  }
  
  throw new Error(`Port ${port} did not become free even after force cleanup`);
}

// Enhanced server startup with better health checking
async function startServer(impl, serverConfig) {
  console.log(`Starting ${impl} server...`);
  
  // Ensure port is free first
  await waitForPortToFree(8000);
  
  return new Promise((resolve, reject) => {
    const [cmd, ...args] = serverConfig.command.split(' ');
    
    const options = {
      shell: true,
      detached: true,
      stdio: 'pipe',
      cwd: path.join(__dirname, '..', '..'),
      env: {
        ...process.env,
        NODE_OPTIONS: '--experimental-vm-modules --no-warnings'
      }
    };

    server = spawn(cmd, args, options);
    
    let serverOutput = '';
    let serverErrors = '';

    server.stdout.on('data', (data) => {
      const output = data.toString();
      serverOutput += output;
      console.log(`[${impl}] STDOUT:`, output.trim());
    });

    server.stderr.on('data', (data) => {
      const output = data.toString();
      serverErrors += output;
      console.log(`[${impl}] STDERR:`, output.trim());
    });

    server.on('error', (error) => {
      console.error(`[${impl}] Server spawn error:`, error);
      reject(error);
    });

    server.on('exit', (code, signal) => {
      console.log(`[${impl}] Server exited with code ${code}, signal ${signal}`);
      if (code !== 0 && code !== null) {
        reject(new Error(`Server exited with code ${code}`));
      }
    });

    // Enhanced health check with multiple strategies
    let retries = 0;
    const maxRetries = 15; // Increased retries
    
    const checkServer = async () => {
      try {
        console.log(`[${impl}] Health check attempt ${retries + 1}/${maxRetries}`);
        
        // First check if the port is responding at all
        const portCheck = await fetch(`${serverConfig.url}/`, {
          timeout: 3000,
          headers: { 'User-Agent': 'Playwright-Test-Health-Check' }
        }).catch(() => null);
        
        if (!portCheck) {
          throw new Error('Server port not responding');
        }
        
        // Then check the specific config endpoint
        const configResponse = await fetch(`${serverConfig.url}${serverConfig.configEndpoint}`, {
          timeout: 5000,
          headers: { 'User-Agent': 'Playwright-Test-Config-Check' }
        });
        
        if (!configResponse.ok) {
          throw new Error(`Config endpoint returned ${configResponse.status}`);
        }
        
        const data = await configResponse.json();
        
        if (data.data && data.data.publicApiKey) {
          console.log(`[${impl}] Server is ready!`);
          resolve(server);
          return;
        }
        
        throw new Error('Server not fully initialized - missing publicApiKey');
        
      } catch (error) {
        console.log(`[${impl}] Health check failed:`, error.message);
        
        if (++retries === maxRetries) {
          console.error(`[${impl}] Server failed to start after ${maxRetries} attempts`);
          console.error(`[${impl}] Server output:`, serverOutput);
          console.error(`[${impl}] Server errors:`, serverErrors);
          reject(new Error(`Server failed to start: ${error.message}`));
          return;
        }
        
        // Progressive backoff
        const waitTime = Math.min(2000 + (retries * 500), 5000);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        checkServer();
      }
    };
    
    // Start checking after initial delay
    setTimeout(checkServer, 3000);
  });
}

// Enhanced server cleanup
async function stopServer() {
  if (server) {
    console.log('Stopping server...');
    
    try {
      // Try graceful shutdown first
      if (server.pid) {
        process.kill(-server.pid, 'SIGTERM');
        console.log('Sent SIGTERM to server process group');
      }
      
      // Wait for graceful shutdown
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Force kill if still running
      try {
        if (server.pid) {
          process.kill(-server.pid, 'SIGKILL');
          console.log('Sent SIGKILL to server process group');
        }
      } catch (e) {
        console.log('Process already terminated');
      }
      
    } catch (error) {
      console.log('Error stopping server:', error.message);
    }
    
    // Additional cleanup
    await new Promise(resolve => setTimeout(resolve, 2000));
    await forceKillPortProcesses(8000);
    
    server = null;
    console.log('Server cleanup completed');
  }
}

// Enhanced form submission with better error handling and debugging
async function submitAndWaitForResponse(page) {
  console.log('Starting form submission...');
  
  // Add network request logging
  const requests = [];
  const responses = [];
  
  page.on('request', request => {
    requests.push({
      url: request.url(),
      method: request.method(),
      headers: request.headers(),
      timestamp: Date.now()
    });
    console.log(`REQUEST: ${request.method()} ${request.url()}`);
  });
  
  page.on('response', response => {
    responses.push({
      url: response.url(),
      status: response.status(),
      timestamp: Date.now()
    });
    console.log(`RESPONSE: ${response.status()} ${response.url()}`);
  });
  
  // Set up response promise with better error handling
  const responsePromise = page.waitForResponse(
    response => {
      const url = response.url();
      const isPaymentEndpoint = url.includes('/process-payment');
      console.log(`Checking response: ${url}, isPaymentEndpoint: ${isPaymentEndpoint}`);
      return isPaymentEndpoint;
    },
    { timeout: 45000 } // Increased timeout
  );

  try {
    // Wait for submit button iframe to be ready
    console.log('Waiting for submit iframe...');
    await page.waitForSelector('iframe[id*="submit"]', { timeout: 20000 });
    
    const submitFrame = page.frameLocator('iframe[id*="submit"]').first();
    const submitButton = submitFrame.locator('button[type="button"]');
    
    // Wait for button to be ready with retry
    let buttonReady = false;
    for (let i = 0; i < 5; i++) {
      try {
        await submitButton.waitFor({ state: 'visible', timeout: 5000 });
        await submitButton.waitFor({ state: 'attached', timeout: 5000 });
        buttonReady = true;
        break;
      } catch (e) {
        console.log(`Button not ready, attempt ${i + 1}/5`);
        await page.waitForTimeout(1000);
      }
    }
    
    if (!buttonReady) {
      throw new Error('Submit button never became ready');
    }
    
    console.log('Clicking submit button...');
    
    // Click with retry mechanism
    let clickSuccess = false;
    for (let i = 0; i < 3; i++) {
      try {
        await submitButton.click({ timeout: 10000 });
        clickSuccess = true;
        console.log('Submit button clicked successfully');
        break;
      } catch (e) {
        console.log(`Click attempt ${i + 1}/3 failed:`, e.message);
        await page.waitForTimeout(1000);
      }
    }
    
    if (!clickSuccess) {
      throw new Error('Failed to click submit button after 3 attempts');
    }

    console.log('Waiting for payment response...');
    const response = await responsePromise;
    
    console.log(`Received response: ${response.status()} ${response.url()}`);
    return response;
    
  } catch (error) {
    console.error('Form submission failed:', error.message);
    console.log('Recent requests:', requests.slice(-5));
    console.log('Recent responses:', responses.slice(-5));
    
    // Additional debugging info
    const currentUrl = page.url();
    console.log('Current page URL:', currentUrl);
    
    // Check if there are any JavaScript errors
    const jsErrors = await page.evaluate(() => {
      return window.lastJSError || 'No JS errors captured';
    });
    console.log('JavaScript errors:', jsErrors);
    
    throw error;
  }
}

// Enhanced form filling with better iframe handling
async function fillPaymentForm(page, testData) {
  console.log('Starting to fill payment form...');
  
  const iframeSelectors = [
    'iframe[id*="card-number"]',
    'iframe[id*="expiration"]', 
    'iframe[id*="cvv"]',
    'iframe[id*="submit"]'
  ];

  // Wait for all iframes with individual timeout handling
  for (const selector of iframeSelectors) {
    console.log(`Waiting for iframe: ${selector}`);
    try {
      await page.waitForSelector(selector, { timeout: 20000 });
      console.log(`Found iframe: ${selector}`);
    } catch (e) {
      console.error(`Failed to find iframe ${selector}:`, e.message);
      throw new Error(`Required iframe ${selector} not found`);
    }
  }

  // Additional wait for iframe content to load
  console.log('Waiting for iframe content to load...');
  await page.waitForTimeout(2000);

  try {
    // Fill card number
    console.log('Filling card number...');
    const cardNumberFrame = page.frameLocator('iframe[id*="card-number"]').first();
    await cardNumberFrame.locator('input[id*="field"]').fill(testData.validCard.number);
    console.log('Card number filled');

    // Fill expiration date
    console.log('Filling expiration date...');
    const expDateFrame = page.frameLocator('iframe[id*="expiration"]').first();
    await expDateFrame.locator('input[id*="field"]').fill(`${testData.validCard.expMonth}${testData.validCard.expYear}`);
    console.log('Expiration date filled');

    // Fill CVV
    console.log('Filling CVV...');
    const cvvFrame = page.frameLocator('iframe[id*="cvv"]').first();
    await cvvFrame.locator('input[id*="field"]').fill(testData.validCard.cvv);
    console.log('CVV filled');
    
  } catch (error) {
    console.error('Error filling payment form:', error.message);
    throw error;
  }
}

// Enhanced test configuration
test.describe.configure({ mode: 'serial' }); // Run tests in sequence to avoid port conflicts

// Test each server implementation
for (const [impl, serverConfig] of Object.entries(testData.testServers)) {
  test.describe(`${impl} implementation`, () => {
    
    test.beforeAll(async () => {
      try {
        await startServer(impl, serverConfig);
      } catch (error) {
        console.error(`Failed to start ${impl} server:`, error.message);
        throw error;
      }
    });

    test.afterAll(async () => {
      await stopServer();
    });

    test(`complete payment flow for ${impl}`, async ({ page }) => {
      // Increase default timeouts
      test.setTimeout(120000); // 2 minutes
      
      // Enable request/response logging
      page.on('console', msg => console.log(`[BROWSER]: ${msg.text()}`));
      
      // Navigate to payment page
      await test.step('Navigate to payment page', async () => {
        console.log(`Navigating to ${serverConfig.url}`);
        await page.goto(serverConfig.url, { timeout: 30000 });
        await expect(page).toHaveTitle('Card Payments');
        console.log('Successfully loaded payment page');
      });

      // Enter billing info and fill form
      await test.step('Fill payment form', async () => {
        await page.fill('#amount', testData.amount);
        await page.fill('#billing_zip', testData.billingInfo.zipCode);
        await fillPaymentForm(page, testData);
        console.log('Payment form filled successfully');
      });

      // Submit and verify
      await test.step('Submit and verify', async () => {
        const response = await submitAndWaitForResponse(page);
        expect(response.status()).toBe(200);
        
        const data = await response.json();
        console.log('Payment response:', data);
        
        expect(data.success).toBe(true);
        expect(data.data.transactionId).toBeDefined();
      });
    });

    test(`handles payment decline for ${impl}`, async ({ page }) => {
      test.setTimeout(120000); // 2 minutes
      
      await page.goto(serverConfig.url, { timeout: 30000 });
      await page.fill('#amount', testData.declineAmount);
      await page.fill('#billing_zip', testData.billingInfo.zipCode);
      await fillPaymentForm(page, testData);

      const response = await submitAndWaitForResponse(page);
      
      // More flexible status checking - some implementations might return different error codes
      const status = response.status();
      expect([400].includes(status)).toBe(true);
      
      const data = await response.json();
      console.log('Decline response:', data);
      
      expect(data.success).toBe(false);
      expect(data.error || data.message).toBeDefined();
    });
  });
}