# 15-oli-matches

QR-driven couple photo upload site using Next.js and Firebase (Firestore + Storage).

## Setup

1. Install dependencies:

```bash
npm install
```

2. Firebase config is embedded in `src/lib/firebase.ts` for this project.

3. Enable Firebase Auth providers:
- Firebase Console → Build → Authentication → Sign-in method
- Enable `Anonymous`
- Enable `Google`

4. Create Firestore and Storage, then set rules:

Firestore rules:
```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /couples/{coupleId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /validCouples/{coupleId} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

Storage rules (images only):
```txt
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /couples/{coupleId}/photo {
      allow read: if true;
      allow write: if request.auth != null
        && request.resource.contentType.matches('image/.*');
    }
  }
}
```

5. Run the dev server:

```bash
npm run dev
```

## Usage

Visit the site with a `couple` query parameter (this is the `coupleKey`):

- `https://<your-site>/?couple=mickey-minnie`

## Deploy (GitHub Pages)

Deployment is handled by `.github/workflows/nextjs.yml`.

- Firebase config is embedded in `src/lib/firebase.ts`.
- Push to `main` and the workflow will build and publish to GitHub Pages.

## Import valid couples

1. Create a Firebase service account key (JSON) and save it as `serviceAccount.json` in the project root.
2. Install the admin SDK:

```bash
npm install
```

3. Run the import script:

```bash
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json node scripts/import-valid-couples.mjs
```

This will create documents in the `validCouples` collection using `coupleKey` as the document ID.
