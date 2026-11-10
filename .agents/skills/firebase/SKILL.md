---
name: firebase
description: Production Firebase architecture and engineering. Covers Cloud Firestore declarative security rules, compound query indexes, Cloud Functions v2 triggers, Firebase Authentication, App Hosting SSR, and Crashlytics telemetry.
---

# Firebase Architecture & Cloud Firestore Engineering

This skill provides exhaustive guidance on engineering scalable, secure, and resilient Firebase applications using Firestore, Cloud Functions v2, Firebase Auth, and App Hosting.

---

## 1. Cloud Firestore Declarative Security Rules

Firestore security rules are evaluated on every request. Write operations are decomposed into `create`, `update`, and `delete`. Never use generic `read, write: if true`.

### Production Firestore Security Rules Template
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    function isDocAuthor() {
      return isAuthenticated() && request.auth.uid == resource.data.authorId;
    }

    function hasValidTimestamp() {
      return request.resource.data.updatedAt == request.time;
    }

    // User profiles collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      // Allow user creation if auth uid matches and required fields exist
      allow create: if isOwner(userId)
        && request.resource.data.keys().hasAll(['email', 'displayName', 'createdAt'])
        && request.resource.data.role == 'user'; // Prevent self-elevation to admin
      
      // Allow update of specific fields only
      allow update: if isOwner(userId)
        && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role', 'createdAt'])
        && hasValidTimestamp();
      
      allow delete: if false; // Profiles cannot be directly deleted via client
    }

    // Projects collection with subcollections
    match /projects/{projectId} {
      allow read: if isAuthenticated() && (
        resource.data.isPublic == true ||
        request.auth.uid in resource.data.collaborators
      );

      allow create: if isAuthenticated()
        && request.resource.data.authorId == request.auth.uid
        && request.resource.data.name is string
        && request.resource.data.name.size() > 0
        && request.resource.data.name.size() <= 100;

      allow update: if isAuthenticated()
        && (resource.data.authorId == request.auth.uid || request.auth.uid in resource.data.admins)
        && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['authorId', 'createdAt']);

      allow delete: if isAuthenticated() && resource.data.authorId == request.auth.uid;

      // Subcollection: Tasks
      match /tasks/{taskId} {
        allow read: if isAuthenticated() && request.auth.uid in get(/databases/$(database)/documents/projects/$(projectId)).data.collaborators;
        allow write: if isAuthenticated() && request.auth.uid in get(/databases/$(database)/documents/projects/$(projectId)).data.collaborators;
      }
    }
  }
}
```

---

## 2. Cloud Functions v2 (Eventarc & HTTP Triggers)

Cloud Functions v2 uses Google Cloud Run under the hood, supporting concurrency, secrets management, and VPC access:

```typescript
// functions/src/index.ts
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

const sendgridApiKey = defineSecret('SENDGRID_API_KEY');

// 1. Reactive Firestore Trigger
export const onUserCreated = onDocumentCreated('users/{userId}', async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const userData = snapshot.data();
  const userId = event.params.userId;

  // Initialize user audit record in transaction
  const auditRef = db.collection('audit_logs').doc();
  await auditRef.set({
    targetUserId: userId,
    event: 'USER_REGISTERED',
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    metadata: { email: userData.email },
  });
});

// 2. High-Concurrency HTTPS Endpoint with Secrets
export const generateReport = onRequest(
  {
    cors: ['https://myapp.com'],
    concurrency: 80,
    memory: '512MiB',
    secrets: [sendgridApiKey],
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).send('Unauthorized');
      return;
    }

    const token = authHeader.split('Bearer ')[1];
    const decoded = await admin.auth().verifyIdToken(token);

    res.status(200).json({ status: 'Report generated', uid: decoded.uid });
  }
);
```

---

## 3. Firestore Compound Queries & Indexing

- **Single-Field Indexes**: Automatically created by Firestore for all scalar fields.
- **Compound Queries**: Whenever combining equality (`==`), inequality (`<`, `<=`, `>`, `!=`), or `in` with `orderBy`, Firestore requires a compound index:
  ```json
  // firestore.indexes.json
  {
    "indexes": [
      {
        "collectionGroup": "tasks",
        "queryScope": "COLLECTION",
        "fields": [
          { "fieldPath": "projectId", "order": "ASCENDING" },
          { "fieldPath": "status", "order": "ASCENDING" },
          { "fieldPath": "dueDate", "order": "DESCENDING" }
        ]
      }
    ]
  }
  ```

---

## 4. Firebase Engineering Checklist

- [ ] **No Open Access Rules**: Run `firebase deploy --only firestore:rules` and verify security simulation passes.
- [ ] **Limit Batch Writes**: Ensure `WriteBatch` operations stay under 500 operations per batch limit.
- [ ] **Document Size Ceiling**: Guarantee individual Firestore documents never exceed the strict $1\,\text{MB}$ ceiling (move large arrays or blobs to Cloud Storage).
- [ ] **Secrets Management**: Use `defineSecret()` in Cloud Functions v2 instead of hardcoded environment variables.
