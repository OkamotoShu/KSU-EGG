import { signInAnonymously } from "firebase/auth";
import {
  collection,
  doc,
  getDocsFromServer,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

// 現在のユーザーの同意記録が存在するか確認
export async function hasAcceptedConsent(
  uid: string
): Promise<boolean> {
  const signatureQuery = query(
    collection(db, "signature"),
    where("uid", "==", uid),
    limit(1)
  );

  const snapshot = await getDocsFromServer(signatureQuery);

  return !snapshot.empty;
}

// 同意記録をサーバーに保存
export async function acceptConsent(): Promise<void> {
  await auth.authStateReady();

  const user =
    auth.currentUser ??
    (await signInAnonymously(auth)).user;

  const alreadyAccepted = await hasAcceptedConsent(user.uid);

  if (alreadyAccepted) return;

  // 新規の記録はUIDをドキュメントIDにして重複を抑える
  await setDoc(doc(db, "signature", user.uid), {
    uid: user.uid,
    date: serverTimestamp(),
  });
}