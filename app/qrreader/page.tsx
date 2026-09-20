// app/qrreader/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Html5QrcodeScanner } from "html5-qrcode";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function QrReaderPage() {
  const router = useRouter();
  const [isScanned, setIsScanned] = useState(false);
  
  // パスワード手入力用の状態
  const [passwordInput, setPasswordInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // スキャナーのインスタンスを保持
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (isScanned) return;

    if (!scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        "qr-reader",
        { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0 
        },
        false
      );

      scannerRef.current.render(
        (decodedText) => {
          // ▼ QR読み取り成功時
          setIsScanned(true);
          if (scannerRef.current) {
            scannerRef.current.clear().catch(console.error);
          }
          router.push(`/loading?qrId=${decodedText}`);
        },
        (error) => {
          // 読み取り中のエラーは無視
        }
      );
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [router, isScanned]);

  // ▼ 手動でパスワードを入力したときの処理
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!passwordInput.trim()) return;

    setIsSearching(true);
    try {
      // "QR"コレクションから、passwordが一致するドキュメントを検索
      const qrRef = collection(db, "QR");
      const q = query(qrRef, where("password", "==", passwordInput.trim()));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // パスワードが一致するQRデータが見つかった場合
        setIsScanned(true);
        if (scannerRef.current) {
          scannerRef.current.clear().catch(console.error); // カメラを停止
        }
        
        // 見つかったドキュメントのID（0〜5）を渡して画面遷移
        const matchedDoc = querySnapshot.docs[0];
        router.push(`/loading?qrId=${matchedDoc.id}`);
      } else {
        // 一致しなかった場合
        setErrorMessage("パスワードがまちがっています。");
      }
    } catch (error) {
      console.error("パスワード検索エラー:", error);
      setErrorMessage("エラーが発生しました。");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <>
      <Header />
      <main className="flex min-h-dvh flex-col items-center justify-center bg-gray-50 pt-20 pb-24 px-4">
        
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-md">
          <h1 className="mb-4 text-center text-xl font-bold text-blue-600">
            QRコードをスキャン
          </h1>
          
          <div className="overflow-hidden rounded-xl bg-gray-100 p-2 border">
            {/* カメラ映像の描画エリア */}
            <div id="qr-reader" className="w-full"></div>
          </div>

          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-gray-300"></div>
            <span className="text-sm font-medium text-gray-500">または</span>
            <div className="h-px flex-1 bg-gray-300"></div>
          </div>

          {/* ▼ 手動入力エリア */}
          <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-3">
            <label className="text-sm font-medium text-gray-700">
              カメラが使えない場合は、キーワードを入力
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="あいことば"
                className="flex-1 rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={isSearching || !passwordInput.trim() || isScanned}
                className="rounded-lg bg-blue-600 px-6 font-bold text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isSearching ? "..." : "送信"}
              </button>
            </div>
            {errorMessage && (
              <p className="text-sm text-red-500 font-medium">{errorMessage}</p>
            )}
          </form>
        </div>

        {isScanned && (
          <p className="mt-6 text-lg font-bold text-green-600 animate-pulse">
            読み取り成功！画面を移動しています...
          </p>
        )}
      </main>
      <Footer />
    </>
  );
}