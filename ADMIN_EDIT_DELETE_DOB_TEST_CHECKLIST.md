# Admin Portal: Edit, Delete, DOB & Password Reset - Test Checklist

## Test Environment Setup
- [ ] Navigate to `/surya` (admin portal)
- [ ] Login with admin credentials
- [ ] Go to "Users" section
- [ ] Ensure you have test data: parents, students, teachers

---

## 1. Student Date of Birth & Age Calculation

### Create Student with DOB
- [ ] Click "Create User" button
- [ ] Select "Student" role
- [ ] Fill in required fields (name, email, username, password)
- [ ] Select a parent from dropdown
- [ ] Enter date of birth (e.g., 2015-03-15)
- [ ] **Expected**: Age preview appears below DOB field showing "Age: X years"
- [ ] Select enrolled courses
- [ ] Click "Create Student"
- [ ] **Expected**: Student created successfully
- [ ] **Expected**: Student appears in list with age displayed under name

### Create Student without DOB
- [ ] Click "Create User" button
- [ ] Select "Student" role
- [ ] Fill in required fields
- [ ] Select a parent
- [ ] Leave DOB field empty
- [ ] Click "Create Student"
- [ ] **Expected**: Student created successfully without age display

### Age Display Verification
- [ ] Find student with DOB in table
- [ ] **Expected**: Age appears under student name: "Age: X years"
- [ ] Verify age calculation is accurate (birth year to current year)
- [ ] Create student with recent birthday (this month)
- [ ] **Expected**: Age calculated correctly considering month and day

### Edge Cases
- [ ] Enter future date in DOB field
- [ ] **Expected**: Should be prevented by `max={today}` attribute
- [ ] Enter DOB for a 1-year-old (born last year)
- [ ] **Expected**: Shows "Age: 1 years"
- [ ] Enter DOB for today
- [ ] **Expected**: Shows "Age: 0 years"

---

## 2. Edit User Functionality

### Open Edit Modal
- [ ] Find any user in the table
- [ ] Click "Edit" button (blue)
- [ ] **Expected**: Edit modal opens
- [ ] **Expected**: All fields pre-populated with current user data
- [ ] **Expected**: Display Name, Email, Phone, Role, Status fields visible

### Edit Display Name
- [ ] Change display name
- [ ] Click "Update User"
- [ ] **Expected**: Success message appears
- [ ] **Expected**: Modal closes
- [ ] **Expected**: User list refreshes
- [ ] **Expected**: New name appears in table

### Edit Email
- [ ] Open edit modal for user
- [ ] Change email address
- [ ] Click "Update User"
- [ ] **Expected**: Email updated in Firestore
- [ ] **Note**: Auth email not updated (requires separate Auth update)

### Edit Phone Number
- [ ] Open edit modal
- [ ] Add/change phone number
- [ ] Click "Update User"
- [ ] **Expected**: Phone updated successfully

### Change Role
- [ ] Open edit modal for user
- [ ] Change role dropdown (e.g., Parent → Teacher)
- [ ] Click "Update User"
- [ ] **Expected**: Role updated
- [ ] **Expected**: Role color badge updates in table

### Change Status
- [ ] Open edit modal
- [ ] Change status (Active → Suspended)
- [ ] Click "Update User"
- [ ] **Expected**: Status updated
- [ ] **Expected**: Status badge changes color

### Cancel Edit
- [ ] Open edit modal
- [ ] Make changes
- [ ] Click "Cancel"
- [ ] **Expected**: Modal closes
- [ ] **Expected**: No changes saved
- [ ] **Expected**: User data remains unchanged

### Edit Multiple Users
- [ ] Edit 3 different users consecutively
- [ ] **Expected**: Each edit works independently
- [ ] **Expected**: No data bleeding between edits

---

## 3. Password Reset Functionality

### Open Password Reset Modal
- [ ] Click "Reset Password" button (yellow) on any user
- [ ] **Expected**: Password reset modal opens
- [ ] **Expected**: User name and email displayed (read-only)
- [ ] **Expected**: Yellow security warning banner visible
- [ ] **Expected**: New password input field visible

### Read Instructions
- [ ] Click "Show Instructions" button
- [ ] **Expected**: Alert appears with detailed instructions:
  - Go to Firebase Console
  - Navigate to Authentication > Users
  - Find user by email
  - Click 3-dot menu > Reset Password
  - User receives reset email
- [ ] **Expected**: Note about Cloud Function requirement

### Cancel Password Reset
- [ ] Open password reset modal
- [ ] Enter new password
- [ ] Click "Cancel"
- [ ] **Expected**: Modal closes
- [ ] **Expected**: No changes made

### Security Warning
- [ ] Verify yellow warning banner is visible
- [ ] Read warning text about Cloud Function requirement
- [ ] **Expected**: Clear message about production security

### Manual Password Reset (Firebase Console)
- [ ] Open Firebase Console
- [ ] Go to Authentication > Users
- [ ] Find test user
- [ ] Click 3-dot menu > Reset Password
- [ ] **Expected**: Confirmation dialog
- [ ] Confirm reset
- [ ] **Expected**: User receives password reset email
- [ ] User clicks reset link in email
- [ ] **Expected**: User can set new password

---

## 4. Delete User Functionality

### Delete with Confirmation
- [ ] Click "Delete" button (red) on test user
- [ ] **Expected**: Confirmation dialog appears
- [ ] **Expected**: Message: "Are you sure you want to delete this user?"
- [ ] Click "Cancel"
- [ ] **Expected**: User not deleted

### Confirm Deletion
- [ ] Click "Delete" button on test user
- [ ] Click "OK" in confirmation dialog
- [ ] **Expected**: Success message: "User deleted successfully"
- [ ] **Expected**: User removed from table immediately
- [ ] **Expected**: User list refreshes

### Verify Deletion
- [ ] Refresh page
- [ ] **Expected**: Deleted user still not in list
- [ ] Check Firebase Console > Authentication
- [ ] **Expected**: User account deleted
- [ ] Check Firestore > users collection
- [ ] **Expected**: User document deleted
- [ ] Check Firestore > usernames collection
- [ ] **Expected**: Username released

### Delete Student (Relationship Cleanup)
- [ ] Create test student under a parent
- [ ] Note student UID in parent's `children` array
- [ ] Delete the student
- [ ] Check parent document in Firestore
- [ ] **Expected**: Student UID removed from parent's `children` array

### Delete Parent with Children
- [ ] Create parent with 2 students
- [ ] Try to delete parent
- [ ] **Expected**: Deletion succeeds or shows warning about children
- [ ] Check students' documents
- [ ] **Note**: Students may become orphaned (depends on business logic)

### Delete Multiple Users
- [ ] Delete 3 users consecutively
- [ ] **Expected**: Each deletion works correctly
- [ ] **Expected**: Table updates after each deletion
- [ ] Refresh page
- [ ] **Expected**: All 3 users remain deleted

---

## 5. Integration Tests

### Create → Edit → Delete Flow
- [ ] Create new student with DOB
- [ ] **Expected**: Student created with age displayed
- [ ] Click Edit on new student
- [ ] Change display name
- [ ] Click Update
- [ ] **Expected**: Name updated
- [ ] Click Reset Password
- [ ] Read instructions
- [ ] Cancel
- [ ] Click Delete
- [ ] Confirm
- [ ] **Expected**: Student deleted successfully

### Multiple Students with Different Ages
- [ ] Create student age 5 (DOB: 2019-XX-XX)
- [ ] Create student age 8 (DOB: 2016-XX-XX)
- [ ] Create student age 12 (DOB: 2012-XX-XX)
- [ ] **Expected**: All ages calculate correctly
- [ ] **Expected**: Ages display in table

### Role Changes via Edit
- [ ] Create user as Parent
- [ ] Edit → Change role to Teacher
- [ ] Save
- [ ] **Expected**: Role updated
- [ ] **Expected**: Custom claims updated (verify in Firebase Console)
- [ ] Edit → Change role to Learning Partner
- [ ] Save
- [ ] **Expected**: Role updated correctly

### Concurrent Edits (Multiple Admins)
- [ ] Admin A opens edit modal for User X
- [ ] Admin B opens edit modal for User X
- [ ] Admin A saves changes
- [ ] Admin B saves changes
- [ ] **Expected**: Last save wins (Firestore behavior)
- [ ] **Note**: No conflict resolution implemented

---

## 6. UI/UX Tests

### Action Buttons Layout
- [ ] **Expected**: 3 buttons in Actions column
- [ ] **Expected**: Edit (blue), Reset Password (yellow), Delete (red)
- [ ] **Expected**: Buttons aligned in a row
- [ ] Hover over each button
- [ ] **Expected**: Background color changes on hover

### Modal Responsiveness
- [ ] Open edit modal on desktop
- [ ] **Expected**: Modal centered, good spacing
- [ ] Resize window to tablet size
- [ ] **Expected**: Modal still usable
- [ ] Resize to mobile size
- [ ] **Expected**: Modal fits screen, scrollable if needed

### Form Validation
- [ ] Open edit modal
- [ ] Clear display name
- [ ] Try to submit
- [ ] **Expected**: HTML5 validation error
- [ ] Clear email
- [ ] Try to submit
- [ ] **Expected**: Validation error

### Age Display in Table
- [ ] Find student with age
- [ ] **Expected**: Name on one line, "Age: X years" on second line
- [ ] **Expected**: Age text is smaller, gray color
- [ ] **Expected**: Aligned with name, good spacing

---

## 7. Error Handling

### Network Errors
- [ ] Turn off WiFi
- [ ] Try to edit user
- [ ] **Expected**: Error message displayed
- [ ] Turn WiFi back on
- [ ] Try again
- [ ] **Expected**: Edit succeeds

### Permission Errors
- [ ] (If possible) Remove admin role
- [ ] Try to edit user
- [ ] **Expected**: Permission denied error
- [ ] **Expected**: Clear error message to user

### Invalid Data
- [ ] Edit user email to invalid format
- [ ] Try to save
- [ ] **Expected**: HTML5 validation catches it
- [ ] Fix email
- [ ] Save
- [ ] **Expected**: Succeeds

### Database Errors
- [ ] Try to edit non-existent user UID
- [ ] **Expected**: Error message: "User not found" or similar

---

## 8. Performance Tests

### Large User List
- [ ] Create 50+ users
- [ ] Open edit modal for various users
- [ ] **Expected**: Modal opens quickly (<500ms)
- [ ] Edit and save
- [ ] **Expected**: List refreshes smoothly

### Multiple Quick Actions
- [ ] Edit user → Save
- [ ] Immediately open edit again
- [ ] **Expected**: Latest data shown
- [ ] Delete user
- [ ] Immediately create new user
- [ ] **Expected**: No conflicts

---

## 9. Security Tests

### Admin-Only Access
- [ ] Logout as admin
- [ ] Login as Teacher
- [ ] Try to access `/surya/users`
- [ ] **Expected**: Access denied or redirect

### Firestore Rules
- [ ] (If possible) Try to update user without admin role
- [ ] **Expected**: Firestore rules block the operation

### Password Reset Security
- [ ] Verify password reset is disabled client-side
- [ ] Check console for security warnings
- [ ] **Expected**: Placeholder function throws error

---

## 10. Browser Compatibility

### Chrome
- [ ] Test all features
- [ ] **Expected**: Everything works

### Firefox
- [ ] Test all features
- [ ] **Expected**: Everything works

### Safari
- [ ] Test all features
- [ ] **Expected**: Everything works
- [ ] Check date picker rendering
- [ ] **Expected**: Safari date input works correctly

### Mobile Safari (iOS)
- [ ] Test on iPhone
- [ ] Check modals
- [ ] **Expected**: Modals usable on mobile
- [ ] Test date picker
- [ ] **Expected**: iOS date picker appears

---

## Bug Tracking

### Issues Found
| # | Issue | Severity | Status | Notes |
|---|-------|----------|--------|-------|
| 1 |       |          |        |       |
| 2 |       |          |        |       |
| 3 |       |          |        |       |

---

## Test Results Summary

**Date Tested**: _____________  
**Tested By**: _____________  
**Browser**: _____________  
**Device**: _____________  

**Overall Status**:
- [ ] All tests passed
- [ ] Some tests failed (see Bug Tracking)
- [ ] Major issues found (testing halted)

**Notes**:
_______________________________________________
_______________________________________________
_______________________________________________

---

## Sign-Off

**Tester Signature**: _____________  
**Date**: _____________  
**Approved for Production**: [ ] Yes [ ] No

