# ASKGenix - JNTUH UCES Campus Recruitment Platform

## Admin Credentials
- **Email**: askgenix.jntuhuces@gmail.com
- **Password**: Vishwanathsofiyankrupa

## Features

### Admin Portal
1. **Test Management**
   - Create tests with multiple questions
   - Support for single correct (MCQ) and multiple correct questions
   - Set test duration and marks per question
   - Edit existing tests and questions
   - Delete tests (with cascade deletion of all attempts)
   - Activate/deactivate tests to control student visibility

2. **Results & Analytics**
   - View detailed results for each test
   - See individual student performance
   - View detailed answer breakdown for each attempt
   - Export results to CSV for further analysis
   - Track submission status (submitted vs auto-submitted)

### Student Portal
1. **Authentication**
   - Signup with email, password, and full name
   - Login to access tests
   - All activities tracked by user ID

2. **Test Taking**
   - View all active tests
   - Modern test interface with timer
   - Real-time answer saving
   - Question navigation (numbered buttons)
   - Visual indicators for answered questions
   - Time warnings (5-minute alert)
   - Auto-submit when time expires
   - Manual submit option

3. **Test History**
   - View all completed tests
   - See scores and percentages
   - Track time taken for each test
   - View submission status

## Technical Features

### Security
- Row Level Security (RLS) enabled on all tables
- Admin-only access to test management and results
- Students can only access their own data
- Proper authentication and authorization checks

### Database Schema
- **users**: Student and admin accounts
- **tests**: Test metadata and settings
- **questions**: Questions with options and correct answers
- **test_attempts**: Student test attempts with scores
- **attempt_answers**: Individual answers for each question

### Edge Cases Handled
- ✅ Timer auto-submit on expiration
- ✅ Resume in-progress tests
- ✅ Prevent multiple attempts
- ✅ Answer persistence during test
- ✅ Time tracking from start to finish
- ✅ Cascading deletes for data integrity
- ✅ Proper handling of unanswered questions

## Usage Instructions

### For Admin:
1. Login with the provided credentials
2. Create a new test by clicking "Create Test"
3. Add questions with options and mark correct answers
4. Set test duration and activate when ready
5. View results anytime by clicking the chart icon
6. Export results to CSV for offline analysis

### For Students:
1. Sign up with your details
2. Login to access your dashboard
3. View active tests in the "Active Tests" tab
4. Click "Start Test" to begin
5. Answer questions and navigate using numbered buttons
6. Submit manually or wait for auto-submit
7. View your results in the "Test History" tab

## Notes
- Time continues to count even if the browser is closed (tracked server-side)
- All data is securely stored in Supabase
- Results are calculated automatically on submission
- CSV export includes all relevant student data
