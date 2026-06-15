import { App, cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { Auth, getAuth } from "firebase-admin/auth";
import { Firestore, getFirestore } from "firebase-admin/firestore";

function getFirebaseAdminPrivateKey() {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!privateKey) {
    return undefined;
  }

  return privateKey.replace(/\\n/g, "\n");
}

let fireStore: Firestore;

export function getFirebaseAdminApp(): App {
  if (getApps().length) {
    return getApp();
  }

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: getFirebaseAdminPrivateKey(),
    }),
  });
}

export function getFirebaseAdminAuth(): Auth {
  return getAuth(getFirebaseAdminApp());
}

export function getFirebaseAdminFirestore(): Firestore {
  if (!fireStore) {
    fireStore = getFirestore(getFirebaseAdminApp());
    fireStore.settings({ ignoreUndefinedProperties: true });
  }
  return fireStore;
}
