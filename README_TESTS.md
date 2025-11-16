# Testing Guide for Tiny Steps Learning Platform

This document explains how to run tests, set up the testing environment, and work with the emulator without sample data.

## Overview

The Tiny Steps platform uses Vitest for unit and integration testing, with Firebase emulators for Firestore and Cloud Functions testing. All sample/demo data has been removed from the codebase to prevent accidental shipping of test data.

## Test Structure

```
tests/
├── security/           # Firestore security rules tests
├── parent/             # Parent dashboard tests
├── teacher/            # Teacher dashboard tests
├── lp/                 # Learning Partner dashboard tests
├── kid/                # Kid dashboard tests
├── admin/              # Admin dashboard tests
├── utils/              # Test utilities and seed data
└── __tests__/          # Cloud Functions tests
```

## Running Tests

### Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Set up Firebase CLI and login:
```bash
firebase login
firebase use tinysteps-react-v1
```

### Run All Tests

```bash
npm test
# or
npx vitest run
```

### Run Tests with Emulators

For tests that require Firestore or Cloud Functions emulators:

```bash
# Start emulators in background
firebase emulators:start --only firestore,functions

# In another terminal, run tests
npm run test:emulator
```

### Run Specific Test Files

```bash
npx vitest run tests/security/firestore-rules.test.ts
npx vitest run tests/parent/ParentDashboard.test.tsx
```

### Watch Mode (for development)

```bash
npx vitest
```

## Test Data Management

### No Sample Data in Production

All hard-coded sample data (names like "Arjun", "Priya", "John Doe") has been removed from UI components. Tests use mock data or deterministic seeders.

### Seeding Test Data

For tests that require Firestore data, we use minimal seeders:

```typescript
import { seedTestData } from '../utils/seedTestData';

// In test setup
await seedTestData(testEnv);
```

The `seedTestData` function creates only the necessary documents for rules testing, without personal data.

### Manual Seeding (Development Only)

For development/testing purposes, you can seed demo data, but this is **disabled by default**:

```bash
# Set environment variable to enable seeding
export ALLOW_DEMO_SEED=true
export SEED_TEACHER_UID="your-teacher-uid"
export SEED_PARENT_UID="your-parent-uid"

# Run the seeding script
node scripts/seed-teacher-dashboard.js
```

**⚠️ WARNING:** Never set `ALLOW_DEMO_SEED=true` in production or shared environments. This could accidentally populate the database with demo users.

### Environment Variables for Seeding

- `ALLOW_DEMO_SEED`: Must be "true" to enable seeding
- `SEED_TEACHER_UID`: UID of an existing teacher user
- `SEED_PARENT_UID`: UID of an existing parent user

## Emulator Setup

### Starting Emulators

```bash
# Start all emulators
firebase emulators:start

# Start specific emulators
firebase emulators:start --only firestore,functions,auth
```

### Emulator Ports

- Firestore: http://localhost:8080
- Functions: http://localhost:5001
- Auth: http://localhost:9099
- UI: http://localhost:4000

### Using Emulator UI

Visit http://localhost:4000 to view emulator data and logs.

## Writing Tests

### Component Tests

Use React Testing Library with Vitest:

```tsx
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('../../hooks/useAuthStore', () => ({
  useAuthStore: () => ({ user: mockUser })
}));

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Firestore Rules Tests

Use Firebase Rules Testing:

```typescript
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';

const testEnv = await initializeTestEnvironment({
  projectId: 'tinysteps-test',
  firestore: { rules: fs.readFileSync('firestore.rules', 'utf8') }
});

const context = testEnv.authenticatedContext('user-uid', { role: 'admin' });
const db = context.firestore();

// Test rules
await expect(db.collection('users').doc('other-uid').get()).resolves.toBeDefined();
```

### Cloud Functions Tests

Test functions with mocked Firebase Admin:

```typescript
vi.mock('firebase-admin', () => ({
  auth: () => ({ createUser: vi.fn() }),
  firestore: () => ({ collection: vi.fn() })
}));

const result = await myFunction(data, context);
expect(result.success).toBe(true);
```

## Mock Data Guidelines

- Use realistic but non-personal data
- Avoid real names, emails, or identifiable information
- Use consistent mock UIDs (e.g., 'teacher-uid', 'parent-uid')
- Mock external dependencies (Firebase, APIs)

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Pushes to main branch
- Manual workflow dispatch

### CI Commands

```bash
# Install dependencies
npm ci

# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## Troubleshooting

### Common Issues

1. **Emulator connection errors**: Ensure emulators are running on correct ports
2. **Auth token issues**: Check that test contexts have proper auth claims
3. **Firestore rules failures**: Verify rule conditions match test setup
4. **Mock not working**: Ensure mocks are defined before imports

### Debug Mode

Enable debug logging:

```bash
DEBUG=vitest:* npm test
FIRESTORE_EMULATOR_DEBUG=true firebase emulators:start
```

### Reset Test Environment

```bash
# Clear emulator data
firebase emulators:clear

# Reset test cache
npx vitest --clearCache
```

## Best Practices

- Write tests for new features before implementation (TDD)
- Keep tests fast and focused
- Use descriptive test names
- Mock external dependencies
- Test both success and error cases
- Update tests when changing business logic
- Run full test suite before committing

## Security Testing

- All Firestore operations are tested against security rules
- Authentication is mocked appropriately
- Role-based access is verified
- Data validation is tested

## Performance Testing

- Tests should complete within reasonable time
- Avoid unnecessary async operations
- Use proper cleanup in afterEach/beforeEach

For more details, see individual test files or ask the development team.