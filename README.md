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

### Docker Prerequisites

- Docker 20.0+ with Docker Compose
- At least 4GB of available RAM
- Global Payments API credentials

### Available Docker Commands

#### Service Management
```bash
./docker-run.sh build          # Build all Docker images
./docker-run.sh start          # Start all payment services
./docker-run.sh stop           # Stop all services
./docker-run.sh status         # Show service status
./docker-run.sh logs           # Show logs for all services
./docker-run.sh logs nodejs    # Show logs for specific service
./docker-run.sh clean          # Remove all containers and images
```

#### Testing
```bash
./docker-run.sh test                    # Run all E2E tests
./docker-run.sh test:single nodejs     # Test specific implementation
./docker-run.sh test:single python     # Test Python implementation
./docker-run.sh test:single php        # Test PHP implementation
./docker-run.sh test:single java       # Test Java implementation
./docker-run.sh test:single go         # Test Go implementation
./docker-run.sh test:single dotnet     # Test .NET implementation
```

#### NPM Shortcuts
```bash
npm run docker:build           # Build all images
npm run docker:start           # Start services
npm run docker:test            # Run all tests
npm run docker:test:nodejs     # Test Node.js only
npm run docker:stop            # Stop services
npm run docker:status          # Show status
```

### Service Ports

When running with Docker, each implementation is available on a different port:

- **Node.js**: http://localhost:8001
- **Python**: http://localhost:8002  
- **PHP**: http://localhost:8003
- **Java**: http://localhost:8004
- **Go**: http://localhost:8005
- **.NET**: http://localhost:8006

### Docker Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Docker Network                         │
│                                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ Node.js │ │ Python  │ │   PHP   │ │  Java   │           │
│  │  :8000  │ │  :8000  │ │  :8000  │ │  :8000  │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
│                                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────────────────────┐       │
│  │   Go    │ │  .NET   │ │      Test Runner        │       │
│  │  :8000  │ │  :8000  │ │     (Playwright)        │       │
│  └─────────┘ └─────────┘ └─────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
         │         │         │         │         │
    ┌────▼────┐┌───▼───┐┌───▼───┐┌───▼───┐┌───▼───┐
    │  :8001  ││ :8002 ││ :8003 ││ :8004 ││ :8005 │
    └─────────┘└───────┘└───────┘└───────┘└───────┘
```

### Container Benefits

1. **Isolation**: Each implementation runs in its own container
2. **Consistency**: Same environment across development, testing, and CI
3. **Parallel Development**: Team members can work on different implementations without conflicts
4. **Easy Testing**: One command tests all implementations
5. **CI/CD Ready**: Perfect for automated testing pipelines
6. **Scalability**: Easy to add new implementations
7. **Debugging**: Individual container logs and health checks

### Development Workflow with Docker

#### Local Development
```bash
# Start specific service
docker-compose up nodejs

# Make changes to code, then rebuild
docker-compose build nodejs

# Test specific implementation
./docker-run.sh test:single nodejs
```

#### Debugging
```bash
# View logs
./docker-run.sh logs nodejs

# Execute into container
docker-compose exec nodejs sh

# Check service health
curl http://localhost:8001/config
```

### Troubleshooting Docker Setup

#### Common Issues

1. **Port conflicts**: 
   ```bash
   ./docker-run.sh stop  # Stop all services
   docker ps             # Check for other containers
   ```

2. **Build failures**:
   ```bash
   ./docker-run.sh clean  # Clean all images
   ./docker-run.sh build  # Rebuild
   ```

3. **Test failures**:
   ```bash
   ./docker-run.sh logs tests  # Check test logs
   ./docker-run.sh status      # Check service health
   ```

4. **Out of disk space**:
   ```bash
   docker system prune -a  # Remove unused images/containers
   ```

#### Memory Requirements

Minimum system requirements:
- **RAM**: 4GB (8GB recommended)
- **Disk**: 2GB free space
- **CPU**: 2 cores (4 cores recommended for parallel testing)

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

## Contributing

When adding new implementations:

1. Create implementation in new directory
2. Follow existing patterns for structure
3. Create `Dockerfile` for containerization
4. Add service to `docker-compose.yml`
5. Update test configuration
6. Add build and test commands to `docker-run.sh`
7. Update documentation