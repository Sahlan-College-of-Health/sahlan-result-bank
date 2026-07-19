# SAHLAN RESULT BANK VERSION 2.2 — GITHUB REUPLOAD

This is a complete replacement project.

## Replace your repository contents

1. Download and extract this ZIP.
2. Open the extracted `Sahlan-Result-Bank` folder.
3. Delete the old files from your GitHub repository, or overwrite every matching file.
4. Upload everything inside the extracted folder.
5. Make sure `index.html` is at the repository root.
6. Commit the changes.
7. Wait for GitHub Pages deployment.

## Clear the previous cached website

Because an older version used a service worker:

1. Open the published website.
2. Press F12.
3. Open Application → Service Workers.
4. Click Unregister.
5. Open Application → Storage.
6. Click Clear site data.
7. Close all website tabs.
8. Reopen the site in Incognito/InPrivate mode.

## Included corrections

- Immediate homepage display instead of a blank page
- Direct loading of app.js without bootstrap.js
- No service worker or PWA caching
- Student login using matric number
- Default student password: sch12345
- Administrator login retained
- Result-only printing
- Larger signature and stamp area
- Complete-session A4 print layout
- Automatic CGPA recalculation after result import
- Backup & Restore sidebar route restored

## Important

Student and administrator authentication still depend on Firebase Identity Toolkit.
A computer whose Windows TLS connection to identitytoolkit.googleapis.com fails will still be unable to authenticate until that TLS issue is fixed.
