/**
 * Card Payment Processing Server
 * 
 * This Express application demonstrates card payment processing using the Global Payments SDK.
 * It provides endpoints for configuration and payment processing, handling tokenized card data
 * to ensure secure payment processing.
 */

import express from 'express';
import * as dotenv from 'dotenv';
import {
    ServicesContainer,
    PorticoConfig,
    Address,
    CreditCardData,
    ApiError
} from 'globalpayments-api';

// Load environment variables from .env file
dotenv.config();

/**
 * Initialize Express application with necessary middleware
 */
const app = express();
const port = process.env.PORT || 8000;

app.use(express.static('.')); // Serve static files
app.use(express.urlencoded({ extended: true })); // Parse form data
app.use(express.json()); // Parse JSON requests

// Configure Global Payments SDK with credentials and settings
const config = new PorticoConfig();
config.secretApiKey = process.env.SECRET_API_KEY;
config.serviceUrl = 'https://cert.api2.heartlandportico.com';
ServicesContainer.configureService(config);

/**
 * Sanitize postal code by removing invalid characters
 * Only allows alphanumeric characters and hyphens, limited to 10 characters
 * 
 * @param {string} postalCode - The postal code to sanitize
 * @returns {string} The sanitized postal code
 */
const sanitizePostalCode = (postalCode) => {
    return postalCode.replace(/[^a-zA-Z0-9-]/g, '').slice(0, 10);
};

/**
 * Config endpoint - provides public API key for client-side tokenization
 */
app.get('/config', (req, res) => {
    res.json({
        success: true,
        data: {
            publicApiKey: process.env.PUBLIC_API_KEY
        }
    });
});

/**
 * Process payment endpoint - handles the actual payment transaction
 * Expects form data with payment_token and billing_zip fields
 */
app.post('/process-payment', async (req, res) => {
    try {
        // Validate required fields are present
        if (!req.body.payment_token || !req.body.billing_zip) {
            throw new Error('Missing required fields');
        }

        // Initialize payment data using tokenized card information
        const card = new CreditCardData();
        card.token = req.body.payment_token;

        // Create billing address for AVS verification
        const address = new Address();
        address.postalCode = sanitizePostalCode(req.body.billing_zip);

        // Process the payment transaction ($10 USD charge)
        const response = await card.charge(10)
            .withCurrency('USD')
            .withAddress(address)
            .execute();

        // Check for successful response code
        if (response.responseCode !== '00') {
            res.status(400).json({
                success: false,
                message: `Payment processing failed`,
                error: {
                    code: 'PAYMENT_DECLINED',
                    details: response.responseMessage
                }
            });
        }

        // Return success response with transaction ID
        res.json({
            success: true,
            message: `Payment successful! Transaction ID: ${response.transactionId}`,
            data: {
                transactionId: response.transactionId
            }
        });
    } catch (error) {
        // Handle different types of errors appropriately
        switch (error.name) {
            case ApiError.constructor.name:
                // Handle API-specific errors
                res.status(400).json({
                    success: false,
                    message: 'Payment processing failed',
                    error: {
                        code: 'API_ERROR',
                        details: error.message
                    }
                });
                break;
            default:
                // Handle general errors
                res.status(500).json({
                    success: false,
                    message: 'Internal server error',
                    error: {
                        code: 'SERVER_ERROR',
                        details: error.message
                    }
                });
                break;
        }
    }
});

// Start the server
app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Server also accessible at http://127.0.0.1:${port}`);
});
