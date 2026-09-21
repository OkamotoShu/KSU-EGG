// app/qrreader/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useZxing } from "react-zxing";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function QRReaderPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // ▼ react-zxing を使ったカメラ起動と読み取り処理
  const { ref } = useZxing({
    onDecodeResult(result) {
      if (isProcessing) return; // 連続読み取りを防止
      setIsProcessing(true);
      
      const text = result.rawValue;
      
      // QRコードのURLから qrId= の数字を抽出（例: https://.../loading?qrId=1）
      // ※もしQRの中身がURLではなくただの数字(1など)の場合は、そのまま取得
      const match = text.match(/qrId=(\d+)/);
      const qrId = match ? match[1] : text;

      if (!isNaN(parseInt(qrId, 10))) {
        router.push(`/loading?qrId=${qrId}`);
      } else {
        // 想定外のQRコードだった場合の処理
        window.location.href = text; 
      }
    },
    onError(error) {
      // 読み取り中（QRが見つからない間）は常にエラーが出続ける仕様なので、ここは空でOKです
    },
  });

  // ▼ パスワード手入力の場合の処理（既存のロジックに合わせて適宜変更してください）
  const handlePasswordSubmit = () => {
    // 例: "egg1" と入力されたら qrId=0 として扱う、などのロジック
    // ここではシンプルに、入力された数字をそのままqrIdとして遷移する例にしています
    if (password.trim() === "") {
      setErrorMsg("パスワードを入力してください");
      return;
    }
    
    // （※ここにFirestoreのQRコレクションと照合する処理を入れてもOKです）
    const dummyQrId = parseInt(password, 10);
    if (!isNaN(dummyQrId) && dummyQrId >= 0 && dummyQrId <= 5) {
      router.push(`/loading?qrId=${dummyQrId}`);
    } else {
      setErrorMsg("正しいパスワードを入力してください");
    }
  };

  return (
    <>
      <Header />
      <main className="flex min-h-dvh flex-col items-center bg-gray-50 pt-20 pb-24 px-4">
        <h1 className="mb-6 text-xl font-bold text-gray-800">QRコードを読み取ろう！</h1>
        
        {/* ▼ カメラ映像の表示領域 */}
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