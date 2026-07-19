# FIREBASE CONFIGURATION AND NETWORK FIX

## The Firebase configuration included in this package

This package now uses the exact configuration supplied by the project owner.

The browser file is:

assets/js/firebase.js

It correctly imports Firebase through Google's browser CDN.

Do not replace it with this npm-only line:

import { initializeApp } from "firebase/app";

That syntax requires npm and a build tool. GitHub Pages cannot resolve it directly.

## Replace the project on GitHub

1. Extract this ZIP.
2. Open your GitHub repository.
3. Choose Add file → Upload files.
4. Upload `index.html`, `assets`, and the other files from inside the extracted `Sahlan-Result-Bank` folder.
5. Confirm that this exact file is replaced:

assets/js/firebase.js

6. Commit the upload.
7. Wait for the Pages deployment to finish.
8. Open the published site in an Incognito/InPrivate window.

## Confirm the deployed file

Open this address in your browser:

https://sahlan-college-of-health.github.io/sahlan-result-bank/assets/js/firebase.js

You should see:

firebasejs/12.16.0/firebase-app.js

and the project ID:

sahlan-result-bank

If an older file appears, GitHub has not deployed the replacement yet or the wrong folder was uploaded.

## If auth/network-request-failed remains

The error `net::ERR_CONNECTION_CLOSED` means the connection to:

identitytoolkit.googleapis.com

was closed before Firebase received a response.

Test these steps:

1. Use a phone hotspot instead of the current Wi-Fi.
2. Disable VPN or proxy.
3. Temporarily disable antivirus Web Shield/HTTPS scanning.
4. Disable browser ad blockers/privacy extensions for the site.
5. Try Chrome or Microsoft Edge in Incognito/InPrivate mode.
6. Check Firebase Authentication → Settings → Authorized domains and add:

sahlan-college-of-health.github.io

7. In Google Cloud Console, make sure Identity Toolkit API is enabled for project `sahlan-result-bank`.
8. Check Google Cloud Console → APIs & Services → Credentials → the web API key.
   Do not restrict it in a way that blocks Identity Toolkit/Firebase Authentication.

The application cannot bypass a network or firewall that closes Google's Identity Toolkit connection.
