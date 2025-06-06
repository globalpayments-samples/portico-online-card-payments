# Card Payment Examples

This directory contains examples of card payment integration using the Global Payments SDK across multiple programming languages and frameworks. Each implementation demonstrates the same core functionality while following language-specific best practices.

## Available Implementations

- [.NET Core](./dotnet/) - ASP.NET Core web application
- [Go](./go/) - Go HTTP server application
- [Java](./java/) - Jakarta EE servlet-based web application
- [Node.js](./nodejs/) - Express.js web application
- [PHP](./php/) - PHP web application
- [Python](./python/) - Flask web application

## Common Features

- Basic card payment processing with tokenization
- Environment-based configuration using .env files
- Error handling and response formatting
- Public/private API key management
- Simple web interface for payment submission

## Core Functionality

All implementations demonstrate:

1. SDK Configuration
   - Loading environment variables
   - Configuring the Global Payments SDK with credentials
   - Setting up service URLs and developer information

2. Payment Processing
   - Accepting tokenized card data
   - Processing a $10 USD charge
   - Handling billing address (postal code)
   - Error handling and response formatting

3. API Endpoints
   - GET `/config` - Provides public API key for client-side use
   - POST `/process-payment` - Processes the payment with token and billing zip
   - Serves a basic HTML interface for testing

## Prerequisites

- Global Payments account
- API credentials (public and private keys)
- Development environment for chosen implementation
- Package manager for dependency installation

## Testing

Each implementation includes:
- Environment variable template (.env.sample)
- Basic run script (run.sh)
- Test page for payment submission

## Security Notes

These examples demonstrate basic implementation patterns and should be enhanced for production use with:
- Additional input validation
- Comprehensive error handling
- Proper logging
- Security headers
- Rate limiting
- Additional payment fraud prevention measures
