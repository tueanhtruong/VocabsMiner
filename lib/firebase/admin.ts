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

const globalForFirebaseAdmin = globalThis as typeof globalThis & {
  fireStore?: Firestore;
};

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
  if (!globalForFirebaseAdmin.fireStore) {
    const fireStore = getFirestore(getFirebaseAdminApp());
    try {
      fireStore.settings({ ignoreUndefinedProperties: true });
    } catch (error) {
      if (
        !(error instanceof Error) ||
        !error.message.includes("Firestore has already been initialized")
      ) {
        throw error;
      }
    }
    globalForFirebaseAdmin.fireStore = fireStore;
  }
  return globalForFirebaseAdmin.fireStore;
}
