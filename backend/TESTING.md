# Backend Testing Guide

This project uses [Jest](https://jestjs.io/) for testing.

## Test Structure

- `tests/unit`: Unit tests for pure functions, utilities, and validators. These tests should be fast and have no side effects (e.g., no database calls).
- `tests/integration`: Integration tests that involve multiple components, such as API routes and database interactions. These tests use an in-memory MongoDB server.

## Running Tests

To run all tests:
```bash
npm test
```

To run only unit tests:
```bash
npx jest tests/unit
```

To run only integration tests:
```bash
npx jest tests/integration
```

To run tests in watch mode:
```bash
npm run test:watch
```

To see test coverage:
```bash
npm run test:coverage
```

## Adding New Tests

### Unit Tests
Place unit tests in `tests/unit`. Use aliases like `@utils`, `@validators`, and `@services` for imports.
Example: `tests/unit/utils/helpers.test.ts`

### Integration Tests
Place integration tests in `tests/integration`. These tests should generally use the `supertest` library to make requests to the app.
Example: `tests/integration/auth.test.ts`

## Configuration

- `jest.config.js`: Main Jest configuration.
- `tests/tsconfig.json`: TypeScript configuration for the tests directory to ensure proper type checking in IDEs.
- `tests/helpers/setup.ts`: Global setup for integration tests (e.g., starting/stopping the MongoDB memory server).
