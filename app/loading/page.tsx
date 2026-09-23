// app/loading/page.tsx
"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth"; // ▼ User型を追加
import { doc, getDoc } from "firebase/firestore";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Egg, TriangleAlert } from "lucide-react";

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
            if (qrIndex === 5) {
              setStatusMessage("ゴール地点をはっけん！");
              setTimeout(() => {
                router.push("/hatch");
              }, 1000);
            } else {
              setStatusMessage("読み取り完了！イベントへ移動します...");
              setTimeout(() => {
                router.push(`/event?qrId=${qrIndex}`);
              }, 1000);
            }
          } else {
            setIsAlreadyScanned(true);
            setStatusMessage("");
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
    <div className="w-full max-w-sm rounded-3xl border border-[#18366B]/10 bg-white px-6 py-8 text-center shadow-[0_10px_30px_rgba(24,54,107,0.08)]">
      {!isAlreadyScanned && (
        <p className="text-xs font-extrabold tracking-[0.16em] text-[#A96500]">
          QR CHECK
        </p>
      )}

      {!isAlreadyScanned && !hasError ? (
        <div
          aria-hidden="true"
          className="mx-auto mt-5 mb-6 h-16 w-16 animate-spin rounded-full border-[5px] border-[#E4F2EE] border-t-[#269D9C] motion-reduce:animate-none"
        />
      ) : isAlreadyScanned ? (
        <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-[50%_50%_46%_46%/60%_60%_40%_40%] border-2 border-[#E2A72F] bg-[#FFF0C2] text-[#A96500] shadow-sm">
          <Egg aria-hidden="true" className="h-11 w-11" strokeWidth={1.8} />
          <span
            aria-label="読み取り済み"
            className="absolute top-1/2 left-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 -rotate-12 items-center justify-center rounded-full border-[3px] border-[#B42332] bg-white/75 text-2xl font-black text-[#B42332] shadow-[inset_0_0_0_2px_rgba(180,35,50,0.25)]"
          >
            済
          </span>
        </div>
      ) : (
        <div className="mx-auto mt-5 mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#FDE7E7] text-[#B42332]">
          <TriangleAlert aria-hidden="true" className="h-10 w-10" strokeWidth={2} />
        </div>
      )}

      {!isAlreadyScanned && (
        <h1 className="text-xl leading-relaxed font-extrabold text-[#18366B]">
          {statusMessage}
        </h1>
      )}

      {isAlreadyScanned && (
        <p className="mt-3 text-sm leading-7 text-[#65748B]">
          ARでもう一度キャラクターと遊べるよ。
        </p>
      )}

      {hasError && (
        <p className="mt-3 text-sm leading-7 text-[#65748B]">
          QRコードをもう一度確認してから、読み取ってみてね。
        </p>
      )}

      {(isAlreadyScanned || hasError) && (
        <div className="mt-7 flex flex-col gap-3">
          {isAlreadyScanned && (
            <button
              type="button"
              onClick={() => router.push(qrIdParam === "5" ? "/hatch?replay=1" : `/event?qrId=${qrIdParam}&replay=1`)}
              className="min-h-14 w-full rounded-2xl bg-[#FFBC39] px-5 py-3 font-extrabold text-[#18366B] shadow-sm transition-colors hover:bg-[#FFB020] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#18366B]"
            >
              ARでもう一度遊ぶ
            </button>
          )}
          <button
            type="button"
            onClick={() => router.push("/")}
            className={`${isAlreadyScanned ? "min-h-12 border-2 border-[#18366B]/15 bg-[#FFFCF3]" : "min-h-14 bg-[#FFBC39] shadow-sm hover:bg-[#FFB020]"} w-full rounded-2xl px-5 py-3 font-extrabold text-[#18366B] transition-colors active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#18366B]`}
          >
            ホームへ戻る
          </button>
        </div>
      )}
    </div>
  );
}

export default function LoadingPage() {
  return (
    <>
      <Header />
      <main className="flex min-h-dvh flex-col items-center justify-center bg-[#FFFCF3] px-5 pt-24 pb-28 text-[#18366B]">
        <Suspense fallback={<p className="font-bold text-[#65748B]">読み込み中...</p>}>
          <LoadingContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
