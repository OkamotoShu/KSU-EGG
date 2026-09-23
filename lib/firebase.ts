// lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// ▼ 1. 今回が「最初の初期化」かどうかを変数に保存しておく
const isFirstInit = !getApps().length;

// ▼ 2. app の初期化（なければ作る、あれば既存のものを使う）
const app = isFirstInit ? initializeApp(firebaseConfig) : getApp();

// ▼ 3. db の初期化（初回のみキャッシュ設定を含めて作成する）
export const db = isFirstInit
  ? initializeFirestore(app, {
      localCache: typeof window !== "undefined" ? persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }) : undefined,
    })
  : getFirestore(app);

export const auth = getAuth(app);