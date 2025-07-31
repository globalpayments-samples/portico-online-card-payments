## Using Docker

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
