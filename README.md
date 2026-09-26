# Foodie — Zomato style food delivery app

React + TypeScript + Firebase (Auth, Firestore, Cloud Storage) — deployed on Firebase Hosting.

Live: **https://bootcamp-e233d.web.app**

## Features

- Restaurant catalogue with search, cuisine chips, veg-only, price cap and sorting
- Restaurant page with category-wise menu, per-dish search and add-to-cart
- Cart drawer with quantity steppers, GST + delivery fee (free above ₹499) and a persisted cart
- Google sign-in for customers, email/password sign-in for staff
- Admin panel (claim-gated): dashboard stats, restaurant CRUD, menu CRUD, order status management
- Saved delivery addresses, profile page, avatar upload from the browser to Cloud Storage
- Checkout that writes a denormalised `orders` doc, then an orders page with a live status tracker and cancel
- All dish and restaurant images served from Firebase Storage

## Stack

| Concern    | Choice                                                    |
| ---------- | --------------------------------------------------------- |
| UI         | React 19, React Router 7, plain CSS with design tokens     |
| Build      | Vite 8, TypeScript strict, oxlint                          |
| Backend    | Firebase Auth, Cloud Firestore, Cloud Storage              |
| Hosting    | Firebase Hosting (SPA rewrites + asset caching)            |
| Admin ops  | `scripts/seed.ts` using the Firebase Admin SDK             |

## Project layout

```
src/
  components/      presentational components (ui primitives, cards, drawer, header)
  config/          Firebase env config + billing constants
  features/        auth / cart / toast → context + provider + hook per feature
  hooks/           data hooks (useRestaurants, useRestaurant, useOrders)
  lib/             Firebase singletons, Storage URL helpers, formatters
  pages/           one folder-level component per route (lazy loaded)
  services/        all Firestore/Storage access lives here
  types/           shared TypeScript types
scripts/seed.ts    seeds Firestore + uploads images to Storage
seed/              seed dataset, SVG image generator, admin bootstrap
```

Layer rule: `pages → hooks/features → services → lib`. Components never import the Firebase SDK.

## Setup

```bash
npm install
cp .env.example .env.local     # paste your Firebase web config
```

Get the web config from **Firebase console → Project settings → Your apps**, or:

```bash
firebase apps:sdkconfig WEB <APP_ID>
```

The config for this project is already in `.env.local` (project `bootcamp-e233d`).

### Admin panel

`/admin` (link in the header). Staff sign in with **email + password** at `/admin/login`; customers
never use it. Access requires the `admin` custom claim on the ID token — the UI guard is only
convenience, the real enforcement is in `firestore.rules`.

Grant or revoke the claim (Admin SDK, needs credentials):

```bash
node --input-type=module -e "
import { applicationDefault, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getProjectId } from './seed/firebase-admin.js'  // or hardcode your project id
const auth = getAuth(initializeApp({ credential: applicationDefault(), projectId: 'bootcamp-e233d' }))
const user = await auth.getUserByEmail('john@doe.com')
await auth.setCustomUserClaims(user.uid, { admin: true })
"
```

After changing a claim the user must sign out and back in (the token is cached).

### One-time Firebase console setup

1. **Authentication → Sign-in method → Google → Enable** — this is the only sign-in method the app uses.
2. **Authentication → Sign-in method → Email/Password → Enable** — required by the admin panel.
3. Make sure Firestore and Storage are created (they are enabled in this project).

### Seed data and images

```bash
npm run seed              # 8 restaurants, ~57 dishes + images
npm run seed -- --force   # re-upload images even if they exist
npm run seed -- --reset   # wipe the restaurants collection and re-seed
```

The script needs admin credentials — either

```bash
gcloud auth application-default login     # then just npm run seed
# or
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json npm run seed
```

Images live in Cloud Storage at `restaurants/<id>/cover.<ext>`, `banner.<ext>` and
`menu/<dishId>.<ext>` — the extension in Firestore always matches the object that was uploaded.

```bash
npm run images            # download free food photos from Wikimedia Commons into seed-images/
npm run images:force      # re-download everything
```

`npm run images` fetches **Public Domain / CC0** photos (falling back to CC BY when the free pool
runs dry) and records every file's author + licence in `seed-images/CREDITS.md`. Any file it cannot
find falls back to a generated SVG placeholder. To use your own photography instead, drop files into
`seed-images/<restaurantId>/` named `cover.jpg`, `banner.jpg` and `<dishId>.jpg` — the seed script
always prefers local files over downloads.

## Develop

```bash
npm run dev        # http://localhost:5173
npm run lint       # oxlint
npm run typecheck  # tsc -b
npm run build      # typecheck + production build
```

To work fully offline, run the emulators in another terminal and set
`VITE_USE_FIREBASE_EMULATORS=true` in `.env.local`:

```bash
npm run emulators   # requires Java 21+
```

## Deploy

```bash
npm run deploy:backend   # firestore rules + indexes + storage rules
npm run deploy:hosting   # build + hosting
# or everything at once
npm run deploy
```

`.firebaserc` pins the default project to `bootcamp-e233d`. Hosting rewrites every unknown path to
`/index.html` so client-side routes work on refresh, and `/assets/*` is served with a one-year cache.

## Security rules

- `restaurants/**` and their `menu` subcollection: public read, write only for admins
  (an `admin == true` custom claim).
- `users/{uid}`: readable/writable only by that user.
- `orders/{orderId}`: a user may create an order where `userId == auth.uid`, read their own, and cancel
  while it is still `placed` (status-only change). Everything else needs the admin claim.
- Storage: `restaurants/**` is public read (acts like a CDN) with admin-only writes; `users/{uid}/avatar`
  is owner read/write, capped at 2 MB and images only.

## Data model

```
admin routes                /admin (overview) · /admin/restaurants · /admin/restaurants/:id/menu · /admin/orders
restaurants/{restaurantId}                 name, cuisines[], rating, ratingCount, priceForTwo,
                                          deliveryTime, address{}, vegOnly, offer, isOpen,
                                          coverImage (storage path), bannerImage (storage path)
restaurants/{restaurantId}/menu/{itemId}   name, description, price, isVeg, category,
                                          image (storage path), inStock, rating?
users/{uid}                                name, email, phone, addresses[], avatar (download URL)
orders/{orderId}                          userId, restaurantId, restaurantName, restaurantImage,
                                          items[], address{}, subtotal, deliveryFee, taxes, total,
                                          paymentMode, status, placedAt
```

Documents store Storage **paths**, not URLs, so signed URLs or a bucket migration never requires
rewriting Firestore data.
