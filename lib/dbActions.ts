// lib/dbActions.ts
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth"; // User型を追加インポート
import { doc, getDoc, DocumentData } from "firebase/firestore";

/**
 * 現在のログインユーザーを取得する（認証完了まで待機するヘルパー関数）
 */
// Promiseの戻り値の型として <User | null> を指定
const getCurrentUser = (): Promise<User | null> => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe(); // 1回取得したら監視を解除
        resolve(user);
      },
      reject
    );
  });
};

/**
 * 現在のユーザーのFirestoreデータを取得する関数
 * @returns ユーザーデータ（存在しない場合や未ログインの場合は null）
 */
export async function getUserData(): Promise<DocumentData | null> {
  try {
    // any を削除（getCurrentUser の型定義により自動で User | null として認識されます）
    const user = await getCurrentUser();
    
    // 未ログインの場合はnullを返す
    if (!user) return null;

    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      // ドキュメントが存在しない場合
      return null;
    }
  } catch (error) {
    console.error("ユーザーデータの取得に失敗しました:", error);
    return null;
  }
}