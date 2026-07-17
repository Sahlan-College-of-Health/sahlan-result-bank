# FINAL SECURITY AND GITHUB PAGES DEPLOYMENT

## A. Create the administrator role document

The login account must exist in both Firebase Authentication and Firestore.

1. Open Firebase Console.
2. Open Authentication > Users.
3. Copy the UID of the administrator account.
4. Open Firestore Database.
5. Open or create the `users` collection.
6. Create a document whose Document ID is exactly the copied UID.
7. Add these fields:

| Field | Type | Value |
|---|---|---|
| name | string | Administrator |
| email | string | your admin email |
| role | string | admin |

The value of `role` must be exactly:

admin

## B. Publish the secure Firestore rules

1. Open Firestore Database > Rules.
2. Open the included file `firestore.rules`.
3. Copy all its contents.
4. Paste them into the Firebase Rules editor.
5. Click Publish.

These rules allow:
- Anonymous and logged-in users to read public result-bank information.
- Only users whose Firestore role is `admin` to add, edit, import, restore or delete records.

## C. Test before uploading to GitHub

Use Live Server and test:

1. Home page opens.
2. Enter Result Bank works.
3. Admission sessions display.
4. Student search works.
5. Student profile opens.
6. Yearly results print.
7. Complete transcript prints.
8. Administrator login works.
9. A non-admin Firebase account is rejected.
10. Excel import works.
11. Result editing works.
12. Backup download and restore work.

## D. Upload to GitHub

1. Create a GitHub account if needed.
2. Sign in to GitHub.
3. Click New repository.
4. Repository name:

sahlan-result-bank

5. Choose Public.
6. Do not add a README because the project already contains one.
7. Click Create repository.

## E. Upload project files

Beginner method:

1. Open the new repository.
2. Click Add file > Upload files.
3. Open the extracted `Sahlan-Result-Bank` folder.
4. Select all files and folders inside it.
5. Drag them to GitHub.
6. Click Commit changes.

Make sure `index.html` is at the top level of the repository, not inside an extra nested folder.

Correct:

sahlan-result-bank/index.html

Incorrect:

sahlan-result-bank/Sahlan-Result-Bank/index.html

## F. Enable GitHub Pages

1. Open the repository Settings.
2. Open Pages.
3. Under Build and deployment, choose Deploy from a branch.
4. Branch: main.
5. Folder: / (root).
6. Click Save.

GitHub will provide an address similar to:

https://yourusername.github.io/sahlan-result-bank/

## G. Add GitHub Pages domain to Firebase

1. Open Firebase Console.
2. Open Authentication > Settings.
3. Open Authorized domains.
4. Click Add domain.
5. Add only the domain portion:

yourusername.github.io

Do not include `https://` or the repository path.

## H. Final important notes

- Firebase web configuration is expected to be visible in frontend code.
- Database protection comes from Authentication and Firestore Rules.
- Keep Anonymous Authentication enabled for public Result Bank access.
- Do not give ordinary users a Firestore `role` value of `admin`.
- Download regular backups and keep them in a secure location.
