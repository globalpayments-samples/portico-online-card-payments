# Card Payment Examples

This directory contains examples of card payment integration using the Global Payments SDK across multiple programming languages and frameworks. Each implementation demonstrates the same core functionality while following language-specific best practices.

## Available Implementations

- [.NET Core](./dotnet/) - ([Preview](https://githubbox.com/globalpayments-samples/portico-online-card-payments/tree/main/dotnet)) - ASP.NET Core web application
- [Go](./go/) - ([Preview](https://githubbox.com/globalpayments-samples/portico-online-card-payments/tree/main/go)) - Go HTTP server application
- [Java](./java/) - ([Preview](https://githubbox.com/globalpayments-samples/portico-online-card-payments/tree/main/java)) - Jakarta EE servlet-based web application
- [Node.js](./nodejs/) - ([Preview](https://githubbox.com/globalpayments-samples/portico-online-card-payments/tree/main/nodejs)) - Express.js web application
- [PHP](./php/) - ([Preview](https://githubbox.com/globalpayments-samples/portico-online-card-payments/tree/main/php)) - PHP web application
- [Python](./python/) - ([Preview](https://githubbox.com/globalpayments-samples/portico-online-card-payments/tree/main/python)) - Flask web application

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

## Docker Setup

### Quick Start with Docker

The fastest way to get all implementations running is using Docker:

```bash
# 1. Setup environment
cp .env.sample .env
# Edit .env with your actual API keys

# 2. Make the management script executable
chmod +x docker-run.sh

# 3. Build all containers
./docker-run.sh build

# 4. Start all services
./docker-run.sh start

# 5. Run tests against all implementations
./docker-run.sh test
```

Learn more about [using Docker with this project](DOCKER.md).

## Traditional Setup (Non-Docker)

If you prefer to run implementations individually without Docker:

### Prerequisites

- Global Payments account
- API credentials (public and private keys)
- Development environment for chosen implementation
- Package manager for dependency installation

### Individual Setup

Each implementation includes:
- Environment variable template (.env.sample)
- Basic run script (run.sh)
- Test page for payment submission

See individual implementation directories for specific setup instructions.

## Testing

### End-to-End Tests

The project includes comprehensive E2E tests that verify:

1. **Complete Payment Flow**
   - Page loads successfully
   - Form fields can be filled out
   - Payment submission works
   - Success/failure responses display correctly

2. **Error Handling**
   - Invalid zip code handling
   - Payment form validation

### Running Tests

#### With Docker (Recommended)
```bash
./docker-run.sh test                    # Test all implementations
./docker-run.sh test:single nodejs     # Test specific implementation
```

#### Traditional Setup
```bash
npm test                    # Run all tests
npm run test:nodejs         # Test Node.js only
npm run test:python         # Test Python only
npm run test:php            # Test PHP only
npm run test:java           # Test Java only
npm run test:go             # Test Go only
```

### CI Integration

GitHub Actions workflow is configured to:
- Run tests on push to main branch
- Run tests on pull requests
- Generate and upload test reports
- Notify on test failures

## Environment Configuration

All implementations require API credentials in a `.env` file:

```bash
# Copy the sample file
cp .env.sample .env

# Edit with your actual credentials
PUBLIC_API_KEY=pkapi_your_public_key_here
SECRET_API_KEY=skapi_your_secret_key_here
```

## Test Cards

| Brand | Number | CVV | Expiry |
|-------|--------|-----|--------|
| Visa | 4012002000060016 | 123 | 12/2025 |
| Mastercard | 5473500000000014 | 123 | 12/2025 |

## Security Notes

These examples demonstrate basic implementation patterns and should be enhanced for production use with:
- Additional input validation
- Comprehensive error handling
- Proper logging
- Security headers
- Rate limiting
- Additional payment fraud prevention measures

## Production Considerations

This setup is designed for development and testing. For production deployment:

1. **Use multi-stage builds** for smaller Docker images
2. **Implement proper secrets management**
3. **Add monitoring and logging**
4. **Configure resource limits**
5. **Use production-grade base images**
6. **Implement health checks and restart policies**
7. **Use HTTPS in production**
8. **Implement CSRF protection**
9. **Configure secure session handling**

## Resources

- [Global Payments Developer Portal](https://developer.globalpayments.com/)
- [API Reference](https://developer.globalpayments.com/api/references-overview)
- [Test Cards](https://developer.globalpayments.com/resources/test-cards)
- [PHP SDK](https://github.com/globalpayments/php-sdk)
- [Node.js SDK](https://github.com/globalpayments/node-sdk)
- [Java SDK](https://github.com/globalpayments/java-sdk)
- [.NET SDK](https://github.com/globalpayments/dotnet-sdk)

## Community

- 🌐 **Developer Portal** — [developer.globalpayments.com](https://developer.globalpayments.com)
- 💬 **Discord** — [Join the community](https://discord.gg/myER9G9qkc)
- 📋 **GitHub Discussions** — [github.com/orgs/globalpayments/discussions](https://github.com/orgs/globalpayments/discussions)
- 📧 **Newsletter** — [Subscribe](https://www.globalpayments.com/en-gb/modals/newsletter)
- 💼 **LinkedIn** — [Global Payments for Developers](https://www.linkedin.com/showcase/global-payments-for-developers/posts/?feedView=all)

Have a question or found a bug? [Open an issue](https://github.com/globalpayments-samples/portico-online-card-payments/issues) or reach out at [communityexperience@globalpay.com](mailto:communityexperience@globalpay.com).

## License

MIT