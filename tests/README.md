# E2E Tests for Card Payment Implementations

This directory contains end-to-end tests that verify the functionality of card payment processing across all implementations (Node.js, Python, PHP, Java, .NET, and Go).

## Setup

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers:
```bash
npm run install:browsers
```

## Running Tests

Run tests in all browsers:
```bash
npm test
```

Run tests in specific browsers:
```bash
npm run test:chrome    # Run in Chromium only
npm run test:firefox   # Run in Firefox only
npm run test:webkit    # Run in WebKit only
```

## Test Coverage

The tests verify:

1. Complete Payment Flow
   - Page loads successfully
   - Form fields can be filled out
   - Payment submission works
   - Success/failure responses display correctly

2. Error Handling
   - Invalid zip code handling
   - Payment form validation

## Test Structure

```
tests/
  └── e2e/
      ├── payment-flow.test.js   # Main test file
      └── test-data.json        # Test data configuration
```

## CI Integration

GitHub Actions workflow is configured to:
- Run tests on push to main branch
- Run tests on pull requests
- Generate and upload test reports
- Notify on test failures

## Environment Requirements

- Node.js 16 or higher
- Each implementation's prerequisites (PHP, Python, etc.)
- Correct environment variables (see .env.sample files)

## Adding New Tests

When adding new tests:
1. Use the existing test patterns in payment-flow.test.js
2. Add test data to test-data.json if needed
3. Ensure tests work across all implementations
4. Add appropriate error handling and assertions
