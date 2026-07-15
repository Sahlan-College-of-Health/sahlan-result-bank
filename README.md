
# SAHLAN RESULT BANK — ADMIN DASHBOARD

This package contains Part 1 of the admin dashboard:

- Firebase Email/Password login
- Responsive admin dashboard
- Firestore record counters
- Student list viewer
- School settings form
- Navigation placeholders for Excel import, results, courses and sessions
- Mobile responsive sidebar
- School logo and blue/gold institutional theme

## 1. Create the first administrator

In Firebase Console:

1. Open Authentication.
2. Open the Users tab.
3. Click Add user.
4. Enter your administrator email and password.
5. Use the same email and password on the website login page.

## 2. Firestore rules for development only

Open Firestore Database > Rules and use:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}

Click Publish.

## 3. Run the project

Do not double-click index.html directly.

In VS Code:

1. Open the Sahlan-Result-Bank folder.
2. Right-click index.html.
3. Click Open with Live Server.

## 4. Firebase configuration

The Firebase configuration is already placed in:

assets/js/firebase.js

## 5. Next module

The next module will add:

- Excel workbook import with SheetJS
- Preview before saving
- Student creation
- Course creation
- Result creation
- Duplicate handling
- Import progress display


## Excel Import Module Added

1. Log in as administrator.
2. Click Import Excel.
3. Select department, admission session, result session, level and semester.
4. Choose your result workbook.
5. Click Preview Workbook.
6. Review detected students and courses.
7. Click Import to Firestore.

The workbook itself is not uploaded. It is read inside the browser and converted into Firestore documents.

The importer creates or updates:

- students
- courses
- sessions
- results

Importing the same semester again updates the same records instead of creating duplicates.

## Course Management and Simplified Result Format

The Courses page now supports:
- manual course entry
- full course title
- credit unit
- department
- level
- semester
- Excel course-list import

Recommended result workbook columns:
1. Full Name
2. Matric Number
3. Sex
4. Course-code columns containing scores only

Do not add GPA, CGPA, grades, carry-over or remark columns. Those will be calculated by the result-processing module.

Before importing results, add or import all courses under Course Management. The result importer will stop when a course code is missing from the course catalogue.


## Result Processing Module

This version adds:

- Automatic A–F grading on a 5.0 scale
- Grade points and credit points
- Semester TNU, TCP and GPA
- Cumulative CGPA across semesters
- Outstanding carry-over tracking
- Automatic removal of a carry-over after the course is passed later
- Academic remarks
- Official printable semester result
- Signature spaces for management

### Default grading scale

- 70–100: A, 5 points
- 60–69: B, 4 points
- 50–59: C, 3 points
- 45–49: D, 2 points
- 40–44: E, 1 point
- 0–39: F, 0 points

After importing results, open Manage Results and click Recalculate All Results.


## Student Profiles and Transcripts

Added:
- Admission session browser
- Student lists by session
- Student search and department filter
- Student academic profile
- Year One, Year Two and Year Three results
- First and Second Semester display
- Complete printable transcript
- Current CGPA, carry-over count and academic standing


## Student Management Module

Added:
- Add student manually
- Search by name or matric number
- Filter by department
- Edit student information
- Update sex, department, admission session and current level
- Delete student profile


## Result Editing and Correction Module

Added:
- Edit individual semester result records
- Correct course scores
- Correct course titles and units
- Add omitted courses
- Remove incorrect courses
- Delete an entire semester result
- Recalculate GPA and CGPA after correction
- Recalculate outstanding carry-over courses after correction


## Admission Session Management

Added:
- Add admission sessions
- Edit session status and notes
- Search admission sessions
- View number of linked students
- Mark sessions Active, Closed or Archived
- Prevent deletion when students are linked to the session


## Editable Grading and Academic Standing Settings

Added:
- Edit grade letters
- Edit score boundaries
- Edit grade points
- Mark grades as Passed or Carry Over
- Configure academic warning CGPA
- Configure probation CGPA
- Configure academic warning carry-over threshold
- Configure probation carry-over threshold
- Restore the default grading system
- Save grading rules in Firestore
- Recalculate all result records after changing grading rules


## Public Welcome Page and Public Result Bank

Added:
- Full school logo without circular cropping
- Blue and gold institutional design
- Animated Student Result Bank title
- Live date and time
- Administrator Login button at the top-right
- Large Enter Result Bank button
- Anonymous public access through Firebase Authentication
- Public admission session browser
- Public student list and search
- Public student academic profile
- Public yearly result and complete transcript printing

Anonymous Authentication must remain enabled in Firebase.


## Backup and Restore

Added:
- Download students, results, courses, sessions and settings as one JSON backup
- Preserve Firestore timestamps in the backup
- Preview backup content before restoring
- Restore records in safe Firestore batches
- Update matching records instead of creating random duplicates

Keep downloaded backup files in a secure location.


## Security and Deployment Module

This version adds:
- Firestore administrator-role verification
- Rejection of authenticated accounts that do not have the admin role
- Secure Firestore rules
- Anonymous read access for the public Result Bank
- Administrator-only create, edit, import, restore and delete operations
- GitHub Pages deployment instructions
- Firebase Authorized Domains instructions

Read DEPLOYMENT-GUIDE.md before publishing the application.


## Administrator Diagnostic Version
Shows the exact UID, missing user document, role value, or Firestore error.
