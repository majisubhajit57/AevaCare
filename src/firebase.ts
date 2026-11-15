import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
export interface FirebaseAppletConfig {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain: string;
  firestoreDatabaseId: string;
  storageBucket: string;
  messagingSenderId: string;
  measurementId?: string;
  oAuthClientId?: string;
  recaptchaSiteKey?: string;
}

const configModules =
  typeof import.meta !== 'undefined' && typeof import.meta.glob === 'function'
    ? (import.meta.glob('../firebase-applet-config.json', {
        eager: true,
        import: 'default',
      }) as Record<string, Partial<FirebaseAppletConfig>>)
    : {};

const rawAppletConfig: Partial<FirebaseAppletConfig> =
  configModules['../firebase-applet-config.json'] ?? {};

const env =
  typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env
    : ({} as Record<string, string | undefined>);

export const firebaseConfig: FirebaseAppletConfig = {
  projectId:
    env.VITE_FIREBASE_PROJECT_ID ||
    rawAppletConfig.projectId ||
    'turing-vector-7ds98',
  appId:
    env.VITE_FIREBASE_APP_ID ||
    rawAppletConfig.appId ||
    '1:601556128134:web:fcdb5be5899bfaeb499c07',
  apiKey:
    env.VITE_FIREBASE_API_KEY ||
    rawAppletConfig.apiKey ||
    'AIzaSyDqvqdrnSqEhLjgs5aq-1TRtvxF0vr-IUo',
  authDomain:
    env.VITE_FIREBASE_AUTH_DOMAIN ||
    rawAppletConfig.authDomain ||
    'turing-vector-7ds98.firebaseapp.com',
  firestoreDatabaseId:
    env.VITE_FIREBASE_DATABASE_ID ||
    rawAppletConfig.firestoreDatabaseId ||
    'ai-studio-carehavensmartel-3de7539f-c43b-4979-9626-98d7eb8df686',
  storageBucket:
    env.VITE_FIREBASE_STORAGE_BUCKET ||
    rawAppletConfig.storageBucket ||
    'turing-vector-7ds98.firebasestorage.app',
  messagingSenderId:
    env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    rawAppletConfig.messagingSenderId ||
    '601556128134',
  measurementId: rawAppletConfig.measurementId || '',
  oAuthClientId:
    rawAppletConfig.oAuthClientId ||
    '601556128134-p5m1gnqjcsq68r21ol750c4vtu6qcbl2.apps.googleusercontent.com',
  recaptchaSiteKey: rawAppletConfig.recaptchaSiteKey || '',
};

export const app: FirebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export type { FirebaseUser };

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData.map((provider) => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

void testConnection();

export {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  onAuthStateChanged,
  firebaseSignOut,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  getDocs,
  query,
  where,
};
