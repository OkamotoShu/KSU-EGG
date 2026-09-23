// lib/dbActions.ts
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth"; // User型を追加インポート
import { doc, getDoc, DocumentData, collection, addDoc, FieldPath, runTransaction } from "firebase/firestore";

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

/**
 * ARで獲得した印を、プレイヤーごとに保存する
 */
export async function saveARMark(playerName: string, markType: 1 | 2 | 3) {
  const user = await getCurrentUser();
  if (!user) throw new Error("ログインしてください");

  const userRef = doc(db, "users", user.uid);
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(userRef);
    const savedValue = snapshot.data()?.arMarks?.[playerName];
    // 旧形式の数値も配列へ変換し、すでにある印を残す
    const currentMarks: number[] = Array.isArray(savedValue)
      ? savedValue
      : [1, 2, 3].includes(savedValue) ? [savedValue] : [];
    const nextMarks = Array.from(new Set([...currentMarks, markType])).sort();
    transaction.update(userRef, new FieldPath("arMarks", playerName), nextMarks);
  });
}

// ▼ 追加: ログを保存する関数
export async function postCollectionInLogs(
  title: string,
  place: string,
  state: string
) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      throw new Error("ログインしてください");
    }
    
    const logData = {
      title: title,
      place: place,
      state: state,
      date: new Date(),
      uid: user.uid,
    };
    
    const logsRef = collection(db, "logs");
    await addDoc(logsRef, logData);
    
  } catch (error) { // ◀︎ any を削除
    console.error("ログの保存に失敗しました:", error);
    
    // ▼ 変更: エラーが Error オブジェクトかどうかを判定して安全にメッセージを取り出す
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("ログの保存中に不明なエラーが発生しました");
  }
}
