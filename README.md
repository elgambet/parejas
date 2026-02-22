# 15-oli-matches

QR-driven couple photo upload site using Next.js and Firebase (Firestore + Storage).

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env.local` file from `.env.example` and fill in your Firebase config:

```bash
cp .env.example .env.local
```

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

Visit the site with a `couple` query parameter:

- `https://<your-site>/?couple=Mickey-Minnie`
- URL-encode spaces if needed: `?couple=Mike%20Wazowski-Sullivan`

## Deploy

This project is configured to deploy to GitHub Pages via `.github/workflows/nextjs.yml`.

```bash
npm run build
npm run deploy
```
