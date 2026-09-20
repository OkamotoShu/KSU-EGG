// app/loading/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth"; // ▼ User型を追加
import { doc, getDoc } from "firebase/firestore";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

function LoadingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const qrIdParam = searchParams.get("qrId");

  const [statusMessage, setStatusMessage] = useState("データをしょり中...");
  const [isAlreadyScanned, setIsAlreadyScanned] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!qrIdParam) {
      router.push("/");
      return;
    }

    const qrIndex = parseInt(qrIdParam, 10);
    if (isNaN(qrIndex) || qrIndex < 0 || qrIndex > 5) {
      setTimeout(() => {
        setHasError(true);
        setStatusMessage("無効なQRコードです。");
      }, 0);
      return;
    }

    // ▼ user: any を user: User に変更
    const processQR = async (user: User) => {
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          const scannedQRs = data.scannedQRs || [0, 0, 0, 0, 0, 0];

          if (scannedQRs[qrIndex] === 0) {
            setStatusMessage("読み取り完了！イベントへ移動します...");
            setTimeout(() => {
              router.push(`/event?qrId=${qrIndex}`);
            }, 1000);
          } else {
            setIsAlreadyScanned(true);
            setStatusMessage("この場所はすでに読み取り済みです！");
          }
        } else {
          router.push("/register");
        }
      } catch (error) {
        console.error("データ処理エラー:", error);
        setHasError(true);
        setStatusMessage("エラーが発生しました。");
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        processQR(user);
      } else {
        router.push("/register");
      }
    });

    return () => unsubscribe();
  }, [qrIdParam, router]);

  return (
    <div className="flex flex-col items-center text-center">
      {!isAlreadyScanned && !hasError ? (
        <div className="mb-6 h-16 w-16 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
      ) : (
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-3xl">
          {isAlreadyScanned ? "🥚" : "⚠️"}
        </div>
      )}
      
      <h1 className="text-xl font-bold text-gray-700">{statusMessage}</h1>
      
      {(isAlreadyScanned || hasError) && (
        <button
          onClick={() => router.push("/")}
          className="mt-8 rounded-lg bg-blue-600 px-6 py-3 font-bold text-white transition-colors hover:bg-blue-700 active:scale-95 shadow-md"
        >
          ホームへ戻る
        </button>
      )}
    </div>
  );
}

export default function LoadingPage() {
  return (
    <>
      <Header />
      <main className="flex min-h-dvh flex-col items-center justify-center bg-gray-50 pt-20 pb-24 px-4">
        <Suspense fallback={<p className="text-gray-500">読み込み中...</p>}>
          <LoadingContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}