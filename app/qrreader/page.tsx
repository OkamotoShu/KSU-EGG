// app/qrreader/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useZxing } from "react-zxing";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { postCollectionInLogs } from "@/lib/dbActions";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function QRReaderPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // ▼ 変更: async を追加してログ送信を待てるようにする
  const { ref } = useZxing({
    async onDecodeResult(result) {
      if (isProcessing) return;
      setIsProcessing(true);
      
      const text = result.rawValue;
      const match = text.match(/qrId=(\d+)/);
      const qrId = match ? match[1] : text;

      if (!isNaN(parseInt(qrId, 10))) {
        // ▼ ログ追加: QR読み取り成功
        await postCollectionInLogs("QR読み取り", `qrId: ${qrId}`, "成功");
        router.push(`/loading?qrId=${qrId}`);
      } else {
        // ▼ ログ追加: 不正なQRコード
        await postCollectionInLogs("QR読み取り", `不正な値: ${text}`, "失敗");
        window.location.href = text; 
      }
    },
    onError(error) {
      // エラーハンドリング（空でOK）
    },
  });

  // ▼ パスワード手入力の処理
  const handlePasswordSubmit = async () => {
    const inputPass = password.trim();

    if (inputPass === "") {
      setErrorMsg("パスワードを入力してください");
      return;
    }

    try {
      // QRコレクションの中から、passwordフィールドが入力値と一致するものを検索
      const q = query(collection(db, "QR"), where("password", "==", inputPass));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // 一致するドキュメントが見つかった場合
        const matchedDoc = querySnapshot.docs[0];
        
        // ▼ 変更: ドキュメントIDそのものを qr_id として取得し、数値化する
        const qrId = parseInt(matchedDoc.id, 10);

        if (!isNaN(qrId) && qrId >= 0 && qrId <= 5) {
          // 成功時の処理とログ保存
          try {
            await postCollectionInLogs("パスワード入力", qrId.toString(), "成功");
          } catch (e) {
            console.error("ログ保存エラー:", e);
          }
          router.push(`/loading?qrId=${qrId}`);
        } else {
          setErrorMsg("QRデータの設定に問題があります");
        }
      } else {
        // 一致するドキュメントが無かった（パスワード間違い）場合
        setErrorMsg("正しいパスワードを入力してください");
        try {
          await postCollectionInLogs("パスワード入力", inputPass, "失敗");
        } catch (e) {
          console.error("ログ保存エラー:", e);
        }
      }
    } catch (error) {
      console.error("パスワード検索エラー:", error);
      setErrorMsg("通信エラーが発生しました");
    }
  };

  return (
    <>
      <Header />
      <main className="flex min-h-dvh flex-col items-center bg-gray-50 pt-20 pb-24 px-4">
        <h1 className="mb-6 text-xl font-bold text-gray-800">QRコードを読み取ろう！</h1>
        
        <div className="mb-8 w-full max-w-sm overflow-hidden rounded-2xl bg-black shadow-lg">
          <video 
            ref={ref} 
            className="h-full w-full object-cover aspect-square" 
            playsInline
            muted
          />
        </div>

        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-md text-center">
          <h2 className="mb-4 text-sm font-bold text-gray-700">カメラが使えない場合は</h2>
          <h3 className="mb-4 text-sm font-bold text-gray-700">近くのスタッフに声をかけてね</h3>
          <div className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="パスワードを入力"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-3 text-center text-lg focus:border-blue-500 focus:outline-none"
            />
            {errorMsg && <p className="text-sm font-bold text-red-500">{errorMsg}</p>}
            <button
              onClick={handlePasswordSubmit}
              className="w-full rounded-xl bg-blue-600 px-4 py-3 font-bold text-white transition hover:bg-blue-700 active:scale-95"
            >
              送信する
            </button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}