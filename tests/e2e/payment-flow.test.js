const { test, expect } = require('@playwright/test');
const testData = require('./test-data.json');
const { spawn } = require('child_process');
const fetch = require('node-fetch');
const path = require('path');

let server;

async function isPortFree(port) {
  try {
    const response = await fetch(`http://localhost:${port}`, { timeout: 1000 });
    return false;
  } catch (error) {
    return true;
  }
}

async function forceKillPortProcesses(port) {
  try {
    const { spawn } = require('child_process');
    
    // Find processes using the port
    const lsof = spawn('lsof', ['-ti', `tcp:${port}`]);
    
    return new Promise((resolve) => {
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
            } catch (e) {
            }
          });
        } else {
        }
        resolve();
      });
    });
  } catch (error) {
  }
}

async function waitForPortToFree(port, maxWait = 30000) {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWait) {
    if (await isPortFree(port)) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // If port is still not free, try force killing processes
  await forceKillPortProcesses(port);
  
  // Final check
  if (await isPortFree(port)) {
    return true;
  }
  
  throw new Error(`Port ${port} did not become free even after force cleanup`);
}

async function startServer(impl, serverConfig) {
  // First ensure port 8000 is free
  await waitForPortToFree(8000);
  
  return new Promise((resolve, reject) => {
    const [cmd, ...args] = serverConfig.command.split(' ');
    // Set NODE_OPTIONS for ES modules support
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

    // Capture and log all stdout
    server.stdout.on('data', (data) => {
      const output = data.toString();
    });

    // Wait for server to be ready
    let retries = 0;
    const maxRetries = 15;
    const checkServer = async () => {
      try {
        const response = await fetch(`${serverConfig.url}${serverConfig.configEndpoint}`, {
          timeout: 10000
        });
        
        const data = await response.json();
        if (response.ok && data.data.publicApiKey) {
          resolve(server);
          return;
        }
        throw new Error('Server not fully initialized');
      } catch (error) {
        if (++retries === maxRetries) {
          reject(new Error(`Server failed to start after ${maxRetries} attempts: ${error.message}`));
          return;
        }
        await new Promise(resolve => setTimeout(resolve, 3000));
        checkServer();
      }
    };
    
    // Start checking after longer initial delay to let process start
    setTimeout(checkServer, 5000);

    // Log all stderr output for debugging
    server.stderr.on('data', (data) => {
      const output = data.toString();
    });

    server.on('error', (error) => {
      reject(error);
    });
  });
}

async function stopServer() {
  if (server) {
    try {
      // Kill the process group (negative PID)
      process.kill(-server.pid, 'SIGTERM');
      
      // Wait a bit for graceful shutdown
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Force kill if still running
      try {
        process.kill(-server.pid, 'SIGKILL');
      } catch (e) {
        // Process likely already dead
      }
    } catch (error) {
    }
    
    // Additional wait to ensure port is freed
    await new Promise(resolve => setTimeout(resolve, 5000));
    server = null;
  }
}

// Helper function to handle form submission and response
async function submitAndWaitForResponse(page) {
  // Create a promise to wait for the response
  const responsePromise = page.waitForResponse(response => 
    response.url().includes('/process-payment'), 
    { timeout: 60000 }
  );

  // Submit through iframe button
  const submitFrame = page.frameLocator('iframe[id*="submit"]').first();
  const submitButton = submitFrame.locator('button[type="button"]');
  
  // Wait for button to be ready
  await submitButton.waitFor({ state: 'visible', timeout: 30000 });
  
  // Log that we're about to click
  await submitButton.click();

  try {
    const response = await responsePromise;
    return response;
  } catch (error) {
    throw error;
  }
}

// Helper function to fill form fields
async function fillPaymentForm(page, testData) {
  
  // Wait for all iframes with debug logging
  const iframeSelectors = [
    'iframe[id*="card-number"]',
    'iframe[id*="expiration"]',
    'iframe[id*="cvv"]',
    'iframe[id*="submit"]'
  ];

  for (const selector of iframeSelectors) {
    await page.waitForSelector(selector, { timeout: 30000 });
  }

  // Additional wait for iframe content to load
  await page.waitForTimeout(2000);

  const cardNumberFrame = page.frameLocator('iframe[id*="card-number"]').first();
  await cardNumberFrame.locator('input[id*="field"]').fill(testData.validCard.number);

  const expDateFrame = page.frameLocator('iframe[id*="expiration"]').first();
  await expDateFrame.locator('input[id*="field"]').fill(`${testData.validCard.expMonth}${testData.validCard.expYear}`);

  const cvvFrame = page.frameLocator('iframe[id*="cvv"]').first();
  await cvvFrame.locator('input[id*="field"]').fill(testData.validCard.cvv);

}

// Test each server implementation
for (const [impl, serverConfig] of Object.entries(testData.testServers)) {
  test.describe(`${impl} implementation`, () => {
    test.beforeAll(async () => {
      await startServer(impl, serverConfig);
    });

    test.afterAll(async () => {
      await stopServer();
    });

    test(`complete payment flow for ${impl}`, async ({ page }) => {
      // Enable debug logging for network requests

      
      // Navigate to payment page
      await test.step('Navigate to payment page', async () => {
        await page.goto(serverConfig.url);
        await expect(page).toHaveTitle('Card Payments');
      });

      // Enter billing zip and fill form
      await test.step('Fill payment form', async () => {
        await page.fill('#amount', testData.amount);
        await page.fill('#billing_zip', testData.billingInfo.zipCode);
        await fillPaymentForm(page, testData);
      });

      // Submit and verify
      await test.step('Submit and verify', async () => {
        const response = await submitAndWaitForResponse(page);
        expect(response.status()).toBe(200);
        
        const data = await response.json();
        
        expect(data.success).toBe(true);
        expect(data.data.transactionId).toBeDefined();
      });
    });

    test(`handles payment decline for ${impl}`, async ({ page }) => {
      await page.goto(serverConfig.url);
      await page.fill('#amount', testData.declineAmount);
      await page.fill('#billing_zip', testData.billingInfo.zipCode);
      await fillPaymentForm(page, testData);

      const response = await submitAndWaitForResponse(page);
      expect(response.status()).toBe(400);
      
      const data = await response.json();
      
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });
  });
}
