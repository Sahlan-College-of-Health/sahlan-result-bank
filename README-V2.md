# SAHLAN RESULT BANK — VERSION 2.0 PROFESSIONAL EDITION

A browser-based Student Result Management System for SAHLAN College of Health Science and Technology, Jos.

## Professional Edition improvements

- Central application configuration in `assets/js/config.js`
- Improved blue-and-gold institutional interface
- Professional loading screen and connection-status messages
- Installable Progressive Web App support
- Offline shell page
- Automated GitHub Pages deployment workflow
- Cache-busting versioned assets
- Firebase browser-CDN configuration
- Automatic GPA/CGPA and carry-over recalculation
- Compact A4 complete-session results
- Public Result Bank and protected administrator dashboard
- Student, course, session, result, grading, backup and transcript management

## First setup

1. Open `assets/js/config.js`.
2. Confirm the Firebase configuration.
3. Enable Email/Password and Anonymous Authentication.
4. Add the administrator role document under `users/{authentication UID}`.
5. Publish `firestore.rules`.
6. Run with Live Server or deploy to GitHub Pages.

## Updating GitHub

Upload all files and folders inside this project directory, including `.github`.

After deployment, press Ctrl + F5 or open the website in an Incognito window.
