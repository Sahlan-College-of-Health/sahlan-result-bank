# START HERE — SAHLAN RESULT BANK VERSION 1.0

## 1. Add your Firebase web configuration

Open:

assets/js/firebase.js

Replace the firebaseConfig values with the exact configuration shown in:

Firebase Console → Project settings → General → Your apps → SDK setup and configuration → Config

## 2. Enable authentication methods

Firebase Console → Authentication → Sign-in method

Enable:

- Email/Password
- Anonymous

## 3. Create the administrator account

Firebase Console → Authentication → Users → Add user

Create the administrator email and password.

## 4. Create the administrator role

Copy the administrator UID from Authentication.

In Firestore, create:

Collection: users
Document ID: the exact Authentication UID

Fields:

- name — string — Administrator
- email — string — the administrator email
- role — string — admin

The value `admin` must be lowercase.

## 5. Publish the included Firestore rules

Open the file:

firestore.rules

Copy it into:

Firestore Database → Rules

Click Publish.

## 6. Run locally

Open the project folder in VS Code.

Right-click index.html and select:

Open with Live Server

## 7. First data workflow

1. Administrator Login
2. Courses → import or add the course catalogue
3. Import Excel → import one department, level and semester
4. Manage Results → Recalculate All Results
5. Browse Result Bank → open a student and print a result or transcript

## 8. Excel templates

The `templates` folder contains:

- SAHLAN-Course-Catalogue-Template.xlsx
- SAHLAN-Student-Result-Template.xlsx

## 9. GitHub deployment

Read:

DEPLOYMENT-GUIDE.md
