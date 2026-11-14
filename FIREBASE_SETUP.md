# Tutorly — Firebase Backend & Security Setup Guide

This project is integrated with **Firebase Authentication**, **Cloud Firestore**, and **Firebase Storage**.

## 1. Provisioned Identifiers
- **Firebase Project ID**: `methodical-mediator-p7854`
- **Firestore Database ID**: `ai-studio-tutorlybanglades-047d19e1-1af8-48df-a1d5-57901bfaf9ab`
- **Config File**: `firebase-applet-config.json` (automatically wired into `src/services/firebase.ts`)
- **Bootstrapped Admin Email**: `nihabalmahjabin@gmail.com` (requires `email_verified: true`)

## 2. Enable Authentication Providers (Firebase Console)
1. Open the [Firebase Console](https://console.firebase.google.com/project/methodical-mediator-p7854/authentication/providers).
2. Under **Sign-in method**, ensure **Google** is enabled (automatically provisioned). Email/Password registration and login UI have been removed so Google Sign-In is the sole client authentication flow.
3. **Legacy Email/Password Account Migration Policy**: Existing user documents created via email/password in earlier phases are **preserved untouched** in Firebase Auth and Firestore (`users/{uid}`, `tutorProfiles/{uid}`, `learnerProfiles/{uid}`). Because Firebase Auth links Google Sign-In by verified email when enabled under **Authentication -> Settings -> User account linking ("Link accounts that use the same email")**, returning Gmail users keep their existing UID and marketplace data seamlessly. Non-Google email accounts remain intact in Firestore for admin support/manual linking.
4. Under **Authentication -> Settings -> Authorized domains**, add your deployed preview / production hostnames (e.g., Cloud Run URL and `localhost`) so `signInWithPopup` works cleanly.
5. **Email Verification Gate**: Security rules require `request.auth.token.email_verified == true` for all standard database writes (`tuitionPosts`, `applications`, `invitations`, `tutorProfiles`, `learnerProfiles`, `tutorFavourites`, `savedTuitions`, `notifications`, `verificationRequests`, `reports`), which Google Sign-In satisfies automatically.

## 3. Deploy Firestore Security Rules & Composite Indexes
- **Security Rules**: `firestore.rules` (deployed via AI Studio `DeployRules` or `firebase deploy --only firestore:rules`).
- **Storage Rules**: `storage.rules` (avatars public read / owner write `<5MB`; verification docs private to owner and verified admin `<10MB`).
- **Composite Indexes**: `firestore.indexes.json`. Deploy with Firebase CLI when needed:
  ```bash
  firebase deploy --only firestore:indexes,storage
  ```

## 4. Security & WhatsApp-First Architecture Summary
- **Zero Internal Messaging**: No chat UI, inbox, threads, or `conversations`/`messages` collections exist anywhere in Tutorly. All direct tutor-guardian communication transitions externally to **WhatsApp (`https://wa.me/8801XXXXXXXXX`)** with prefilled inquiry text and optional **Facebook profile links (`https://facebook.com/...`)**.
- **PII & Anti-Scraping Contact Isolation**:
  - `users/{userId}` and `learnerProfiles/{profileId}` are readable only by the document owner or verified admin.
  - Public `tutorProfiles/{profileId}` excludes `email`, `phone`, `whatsappNumber`, `normalizedWhatsappNumber`, and `facebookUrl`.
  - Tutor WhatsApp and Facebook links live in `tutorProfiles/{profileId}/private/contact`, with `allow list: if false` and `allow get` gated by authentication, explicit `whatsappConsent`, and `contactVisibility` (`authenticated` | `shortlisted_only` | `hidden`), plus a client-side rate guard.
  - Public `tuitionPosts/{postId}` omits guardian `whatsappNumber` and `detailedAddress`; those reside in `tuitionPosts/{postId}/private/contact`, unlocked only for the post owner, verified admin, or a tutor whose deterministic application `applications/{postId}_{tutorId}` has status `'shortlisted'`, `'invited'`, or `'accepted'`.
- **Mandatory Tutor Profile Onboarding Gate**: First-time tutors (or dual-role users switching to Tutor mode without a published profile) are routed to `TutorOnboardingWizard`, requiring a non-placeholder profile photo, validated Bangladeshi WhatsApp number (`8801[3-9]XXXXXXXX`), explicit WhatsApp consent, valid Facebook profile URL, current university, department, academic year, semester/status, district, subjects, classes, and expected monthly fee before publishing.
- **Deterministic Application Deduplication & Atomicity**:
  - Application IDs follow `${tuitionPostId}_${tutorId}`, preventing duplicate applications per post and blocking self-applications or closed-post applications at both client and rule levels.
  - Submitting an application runs an atomic `writeBatch` with `existsAfter(...)` verification in `firestore.rules`.

## 5. Free Tier (Spark) vs Blaze Quota Notes
- AI Studio provisions Firestore on the free tier with daily read/write limits (see the **Spark** plan column under Enterprise edition in [Firebase Pricing](https://firebase.google.com/pricing#cloud-firestore)).
- If you encounter `"Quota exceeded for quota metric 'Free daily read units per project (free tier database)'"`, quotas reset daily or can be upgraded in the Firebase Console:
  `https://console.firebase.google.com/project/methodical-mediator-p7854/firestore/databases/ai-studio-tutorlybanglades-047d19e1-1af8-48df-a1d5-57901bfaf9ab/data?openUpgradeDialog=true`
- **Important**: Always review and test `firestore.rules` with `@firebase/rules-unit-testing` (`security_spec.md`) before broad public launch.
