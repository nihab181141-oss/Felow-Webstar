# FeLoW WebStaR Firestore Security Specification (Phase 4)

## 1. Data Invariants
1. **Identity Integrity (Google-Only Auth)**: Every user-owned document (`users`, `learnerProfiles`, `tutorProfiles`, `tuitionPosts`, `applications`, `invitations`, `tutorFavourites`, `savedTuitions`, `verificationRequests`, `reports`, `notifications`) MUST enforce that its author/owner field (`uid`, `learnerId`, `tutorId`, `userId`, `reportedById`, `senderId`) equals `request.auth.uid` on creation and remains immutable on update.
2. **Verified Write Gate**: All standard client write operations require `request.auth != null && request.auth.token.email_verified == true` (automatically satisfied by Google Sign-In).
3. **No Self-Assigned Privileges or Verification**: Users cannot set `activeRole: 'admin'`, `availableRoles` containing `'admin'`, `accountStatus: 'suspended'`, `isFeatured: true`, `rating > 0`, `badges` non-empty, or `verification.*.status != 'unverified'` on client writes.
4. **Admin Email Spoof Prevention**: Bootstrapped admin check (`nihabalmahjabin@gmail.com`) MUST check `request.auth.token.email_verified == true` alongside `exists(/databases/$(database)/documents/admins/$(request.auth.uid))`.
5. **PII & Tutor Contact Isolation**:
   - `users/{userId}` and `learnerProfiles/{profileId}` contain `email`, `phone`, `whatsappNumber` and are readable ONLY by the document owner or admin.
   - Public `tutorProfiles/{profileId}` excludes `email`, `phone`, `whatsappNumber`, `normalizedWhatsappNumber`, and `facebookUrl`.
   - Tutor contact links reside in `tutorProfiles/{profileId}/private/contact`, with `allow list: if false` and `allow get` permitted only for the tutor owner, admin, or authenticated users when `whatsappConsent == true && contactVisibility == 'authenticated'`.
   - Public `tuitionPosts/{postId}` excludes `whatsappNumber` and `detailedAddress`; those reside in `tuitionPosts/{postId}/private/contact` readable ONLY by the post owner, admin, or a tutor whose deterministic application `applications/{postId}_{tutorId}` has status `'shortlisted'`, `'invited'`, or `'accepted'`.
6. **Deterministic Application Uniqueness & Referential Integrity**:
   - Application document ID MUST equal `${tuitionPostId}_${request.auth.uid}`.
   - Referenced `tuitionPosts/{tuitionPostId}` MUST exist, have `status == 'open'`, `learnerId == incoming().learnerId`, and `learnerId != request.auth.uid`.
   - Incrementing `tuitionPosts/{postId}.totalApplicants` by +1 MUST occur atomically with `existsAfter(/databases/$(database)/documents/applications/$(postId + '_' + request.auth.uid))`.
7. **Terminal State Locking**: Once a tuition post reaches `'closed'` or an application reaches `'accepted'`, `'rejected'`, or `'withdrawn'`, non-admin clients cannot reopen or mutate it.
8. **Zero Internal Messaging**: No `conversations` or `messages` collections exist; default-deny catch-all blocks any unmodeled collection. All direct communication happens externally via validated WhatsApp (`https://wa.me/8801XXXXXXXXX`) and Facebook profile links.

---

## 2. The "Dirty Dozen" Adversarial Payloads (All Expected: `PERMISSION_DENIED`)

1. **Shadow Update / Ghost Field (`users/{uid}`)**:
   ```json
   { "uid": "user1", "name": "Attacker", "isAdmin": true, "role": "admin" }
   ```
2. **Email Spoofing Admin Escalation (`admins` / `verificationRequests`)**:
   - Auth token `{ "email": "nihabalmahjabin@gmail.com", "email_verified": false }` attempting `update` on `verificationRequests/vr1`:
   ```json
   { "status": "approved" }
   ```
3. **PII Blanket Read (`users/{otherUid}` or `learnerProfiles/{otherUid}`)**:
   - Authenticated non-owner (`uid: "user2"`) issuing `get` or `list` on `/users/user1` or `/learnerProfiles/user1`.
4. **Guardian Private Contact Scrape (`tuitionPosts/{postId}/private/contact`)**:
   - Tutor whose application is still `'pending'` (or has not applied) attempting `get` on `/tuitionPosts/post1/private/contact`.
5. **Self-Verification Forgery (`tutorProfiles/{uid}`)**:
   ```json
   {
     "headline": "BUET Tutor",
     "verification": { "identity": { "status": "verified" }, "institution": { "status": "verified" }, "qualification": { "status": "verified" } },
     "rating": 5.0
   }
   ```
6. **Duplicate / Non-Deterministic Application ID (`applications/randomId123`)**:
   ```json
   { "tuitionPostId": "post1", "learnerId": "guardian1", "tutorId": "tutor1", "proposedSalaryBDT": 8000, "status": "pending" }
   ```
7. **Self-Application to Own Tuition Post (`applications/post1_guardian1`)**:
   - User `guardian1` applying to their own post (`post1.learnerId == "guardian1"`):
   ```json
   { "tuitionPostId": "post1", "learnerId": "guardian1", "tutorId": "guardian1", "proposedSalaryBDT": 8000, "status": "pending" }
   ```
8. **State Shortcutting (`applications/post1_tutor1`)**:
   - Applicant tutor `tutor1` attempting `create` with `"status": "accepted"` or `update` changing `"status"` from `"pending"` to `"accepted"`.
9. **Orphaned Counter Inflation (`tuitionPosts/post1`)**:
   - Tutor attempting `update` `{ "totalApplicants": 999 }` without atomic `existsAfter` application creation or jumping more than `+1`.
10. **ID Poisoning (`tuitionPosts/invalid$id!#` or >128 char ID)**:
    - Attempting `set` on `/tutorFavourites/abc$$$...150chars...`.
11. **Temporal Integrity Spoofing (`tuitionPosts/{postId}`)**:
    - Client sending `"createdAt": "2020-01-01T00:00:00Z"` instead of `serverTimestamp()` (`request.time`).
12. **Value Poisoning / Resource Exhaustion (`applications/post1_tutor1`)**:
    - Client sending a 50KB `coverLetter` string or non-numeric `proposedSalaryBDT: "free"`.

---

## 3. Verification Test Runner (`firestore.rules.test.ts` Reference)

```ts
import { assertFails, assertSucceeds, initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore';
import * as fs from 'fs';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'felow-webstar-security-test',
    firestore: { rules: fs.readFileSync('firestore.rules', 'utf8') }
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe('FeLoW WebStaR Zero-Trust Firestore Rules (Dirty Dozen)', () => {
  it('1. Rejects shadow fields & self-assigned admin role on users', async () => {
    const db = testEnv.authenticatedContext('user1', { email_verified: true }).firestore();
    await assertFails(setDoc(doc(db, 'users', 'user1'), { uid: 'user1', activeRole: 'admin', isAdmin: true }));
  });

  it('2. Rejects unverified admin email spoof on verificationRequests', async () => {
    const db = testEnv.authenticatedContext('spoof', { email: 'nihabalmahjabin@gmail.com', email_verified: false }).firestore();
    await assertFails(updateDoc(doc(db, 'verificationRequests', 'vr1'), { status: 'approved' }));
  });

  it('3. Rejects PII blanket reads on users & learnerProfiles', async () => {
    const db = testEnv.authenticatedContext('user2', { email_verified: true }).firestore();
    await assertFails(getDoc(doc(db, 'users', 'user1')));
    await assertFails(getDocs(collection(db, 'learnerProfiles')));
  });

  it('4. Rejects un-shortlisted tutor reading guardian private contact', async () => {
    const db = testEnv.authenticatedContext('tutor1', { email_verified: true }).firestore();
    await assertFails(getDoc(doc(db, 'tuitionPosts', 'post1', 'private', 'contact')));
  });

  it('5. Rejects tutor self-verifying badges or rating', async () => {
    const db = testEnv.authenticatedContext('tutor1', { email_verified: true }).firestore();
    await assertFails(updateDoc(doc(db, 'tutorProfiles', 'tutor1'), { rating: 5.0, updatedAt: serverTimestamp() }));
  });

  it('6. Rejects non-deterministic application ID', async () => {
    const db = testEnv.authenticatedContext('tutor1', { email_verified: true }).firestore();
    await assertFails(setDoc(doc(db, 'applications', 'randomId123'), { tuitionPostId: 'post1', tutorId: 'tutor1', learnerId: 'guardian1', status: 'pending' }));
  });

  it('7. Rejects guardian applying to own tuition post', async () => {
    const db = testEnv.authenticatedContext('guardian1', { email_verified: true }).firestore();
    await assertFails(setDoc(doc(db, 'applications', 'post1_guardian1'), { tuitionPostId: 'post1', tutorId: 'guardian1', learnerId: 'guardian1', status: 'pending' }));
  });

  it('8. Rejects tutor shortcutting application status to accepted', async () => {
    const db = testEnv.authenticatedContext('tutor1', { email_verified: true }).firestore();
    await assertFails(updateDoc(doc(db, 'applications', 'post1_tutor1'), { status: 'accepted', updatedAt: serverTimestamp() }));
  });

  it('9. Rejects orphaned totalApplicants inflation', async () => {
    const db = testEnv.authenticatedContext('tutor1', { email_verified: true }).firestore();
    await assertFails(updateDoc(doc(db, 'tuitionPosts', 'post1'), { totalApplicants: 999, updatedAt: serverTimestamp() }));
  });

  it('10. Rejects ID poisoning with invalid characters', async () => {
    const db = testEnv.authenticatedContext('user1', { email_verified: true }).firestore();
    await assertFails(setDoc(doc(db, 'tutorFavourites', 'bad$id!'), { userId: 'user1', tutorId: 't1', createdAt: serverTimestamp() }));
  });

  it('11. Rejects spoofed client createdAt timestamp', async () => {
    const db = testEnv.authenticatedContext('user1', { email_verified: true }).firestore();
    await assertFails(setDoc(doc(db, 'tuitionPosts', 'p99'), { learnerId: 'user1', status: 'open', createdAt: '2020-01-01T00:00:00Z' }));
  });

  it('12. Rejects oversized string / type poisoning', async () => {
    const db = testEnv.authenticatedContext('tutor1', { email_verified: true }).firestore();
    await assertFails(setDoc(doc(db, 'applications', 'post1_tutor1'), { tuitionPostId: 'post1', tutorId: 'tutor1', learnerId: 'guardian1', proposedSalaryBDT: 'free', coverLetter: 'x'.repeat(50000) }));
  });
});
```
