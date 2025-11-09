# Test Strategy for Tiny Steps v2.1

## Test Matrix

### Cloud Functions

| Test ID | Function Tested       | Preconditions                          | Steps                                                                 | Expected Result                          | Assertions to Verify                                                                 |
|---------|-----------------------|---------------------------------------|----------------------------------------------------------------------|------------------------------------------|-------------------------------------------------------------------------------------|
| CF-01   | setUserRole           | Admin user authenticated              | Call function with valid role and admin token                        | Returns `{ success: true }`              | `setCustomUserClaims` called with correct params                                     |
| CF-02   | setUserRole           | Non-admin user authenticated          | Call function with non-admin token                                   | Throws `PERMISSION_DENIED`               | Error message matches                                                              |
| CF-03   | setUserRole           | Admin user, invalid role              | Call function with invalid role                                      | Throws `INVALID_ARGUMENT`                | Error message matches                                                              |
| CF-04   | onSessionComplete     | Session exists                        | Trigger function with valid session data                             | Updates session status to `completed`    | Firestore updated with correct session status                                      |
| CF-05   | webhookRazorpay       | Valid Razorpay webhook payload        | Call function with valid payload                                     | Processes payment successfully           | Firestore updated with payment status                                              |

### Firestore Rules

| Test ID | Rule Tested           | Preconditions                          | Steps                                                                 | Expected Result                          | Assertions to Verify                                                                 |
|---------|-----------------------|---------------------------------------|----------------------------------------------------------------------|------------------------------------------|-------------------------------------------------------------------------------------|
| FR-01   | Role-based Access     | Parent linked to child                | Query `kids/{kidId}` as parent                                        | Query allowed                             | Firestore rules allow query                                                        |
| FR-02   | Role-based Access     | Parent not linked to child            | Query `kids/{kidId}` as different parent                             | Query denied                             | Firestore rules deny query                                                         |
| FR-03   | Data Validation       | Valid data structure                  | Write valid data to Firestore                                        | Write succeeds                           | Firestore rules allow write                                                        |
| FR-04   | Data Validation       | Invalid data structure                | Write invalid data to Firestore                                      | Write denied                             | Firestore rules deny write                                                         |

### Components

| Test ID | Component Tested      | Preconditions                          | Steps                                                                 | Expected Result                          | Assertions to Verify                                                                 |
|---------|-----------------------|---------------------------------------|----------------------------------------------------------------------|------------------------------------------|-------------------------------------------------------------------------------------|
| CO-01   | LoginForm             | None                                  | Render component                                                     | Email, password inputs and submit visible | Inputs and button rendered                                                        |
| CO-02   | LoginForm             | None                                  | Enter email/password, click submit                                   | Calls `handleLogin`                      | Mock `handleLogin` called                                                          |
| CO-03   | Dashboard             | User authenticated                    | Render component                                                     | Displays user-specific data               | Data rendered matches mock                                                        |
| CO-04   | ProgressForm          | Teacher authenticated                 | Render component, submit progress                                    | Calls Firestore update                   | Firestore update called with correct data                                          |

### Integration Flows

| Test ID | Flow Tested           | Preconditions                          | Steps                                                                 | Expected Result                          | Assertions to Verify                                                                 |
|---------|-----------------------|---------------------------------------|----------------------------------------------------------------------|------------------------------------------|-------------------------------------------------------------------------------------|
| IF-01   | Login → Redirect      | Valid credentials                     | Submit login form                                                    | Redirects to dashboard                   | URL matches `/dashboard`                                                          |
| IF-02   | Load Data             | User authenticated                    | Navigate to dashboard                                                | Data loads successfully                  | Firestore queries return expected data                                            |

---

## Notes
- Use Jest for unit tests.
- Use Firebase Emulator for Firestore rules testing.
- Mock external dependencies (e.g., Razorpay, Firestore SDK).
- Ensure 80%+ test coverage for critical paths.