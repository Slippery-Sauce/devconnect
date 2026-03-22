# DevConnect

A platform where developers post projects, find teammates, and collaborate — with AI-powered skill matching via Claude.

## Stack

- **React + Vite** — frontend
- **Tailwind CSS** — styling, dark mode
- **React Router v6** — routing
- **Zustand** — global state + match score cache
- **Firebase Auth** — email/password + Google OAuth
- **Firestore** — projects, requests, tasks
- **Firebase Realtime Database** — group chat
- **Claude API** (claude-sonnet-4-20250514) — AI match scoring

---

## Setup

### 1. Clone and install

```bash
git clone <your-repo>
cd devconnect
npm install
```

### 2. Firebase setup

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project
3. Add a **Web App** and copy the config
4. Enable **Authentication** → Sign-in methods → **Email/Password** + **Google**
5. Enable **Firestore Database** (start in test mode)
6. Enable **Realtime Database** (start in test mode)
7. Copy your Realtime Database URL (looks like `https://your-project-default-rtdb.firebaseio.com`)

### 3. Environment variables

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

> **Note:** The Anthropic API key is used client-side for this demo. For production, proxy requests through your own backend to keep the key secret.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

On first sign-in, 8 realistic seed projects are automatically written to Firestore.

### 5. Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Add all `VITE_*` environment variables in the Vercel dashboard under **Project → Settings → Environment Variables**.

---

## Project structure

```
src/
├── App.jsx                  # Router, auth guard, toast container
├── main.jsx                 # React entry point
├── index.css                # Tailwind + global animations
├── lib/
│   ├── firebase.js          # Firebase init (add your credentials to .env)
│   ├── claude.js            # Claude AI match scoring with fallback
│   ├── seedData.js          # 8 seed projects written on first load
│   └── utils.js             # timeAgo, initials, avatar colors, score colors
├── store/
│   └── useStore.js          # Zustand global state
├── hooks/
│   └── useToast.js          # Global toast notification system
├── components/
│   ├── Layout.jsx           # Shell with drawer + bottom nav + outlet
│   ├── Topbar.jsx           # Sticky top bar with back/menu button
│   ├── Drawer.jsx           # Animated slide-in side nav
│   ├── BottomNav.jsx        # Fixed bottom tab bar
│   ├── ProjectCard.jsx      # Feed card with AI match badge
│   ├── MatchBadge.jsx       # Green/amber/red match score pill
│   ├── SkillTag.jsx         # Blue skill chip, optionally removable
│   ├── Avatar.jsx           # Initials avatar with deterministic color
│   ├── Skeleton.jsx         # Shimmer skeleton loaders
│   └── Toggle.jsx           # Settings toggle switch
└── pages/
    ├── Auth.jsx             # Login / Sign up + Google OAuth
    ├── Home.jsx             # Feed + filters + FAB + post modal
    ├── RequestDetail.jsx    # Project detail + AI match + apply
    ├── Requests.jsx         # Incoming / Sent request tabs
    ├── Projects.jsx         # My project space
    ├── ProjectGroup.jsx     # Chat / Tasks / Members / Files
    ├── Profile.jsx          # Editable profile + skills
    └── Settings.jsx         # Toggles + change password + logout
```

---

## AI match scoring

Two touchpoints:

1. **Feed cards** — every card shows a coloured `% match` badge computed by Claude comparing your skills to the project's required skills. Results are cached in Zustand so the API is only called once per project per session.

2. **Detail page** — the cached result is reused and displayed in a highlighted box with the full reason sentence.

If the API is unavailable (no key, network error, etc.), a deterministic fallback scorer based on skill overlap is used transparently.

---

## Firestore rules (recommended for production)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    match /projects/{projectId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.ownerId;
    }
    match /requests/{requestId} {
      allow read: if request.auth != null &&
        (request.auth.uid == resource.data.applicantId ||
         request.auth.uid == resource.data.ownerId);
      allow create: if request.auth != null;
      allow update: if request.auth.uid == resource.data.ownerId;
    }
    match /tasks/{projectId}/items/{taskId} {
      allow read, write: if request.auth != null;
    }
  }
}
```
