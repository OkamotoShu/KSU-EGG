// app/qrreader/page.tsx
"use client";

import { useRef, useState } from "react";
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
  // 手入力ダイアログへの参照
  const manualDialogRef = useRef<HTMLDialogElement>(null);

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

      <main className="flex min-h-dvh flex-col items-center bg-[#FFFCF3] px-5 pt-24 pb-28 text-[#18366B]">
        {/* ページタイトル */}
        <div className="mb-4 shrink-0 text-center">
          <h1 className="text-2xl font-extrabold">
            QRをよみとろう
          </h1>
          <p className="mt-2 text-sm">
            コードをわくの中に入れてね
          </p>
        </div>

        {/* 画面の高さに合わせてカメラ枠を調整 */}
        <div className="flex w-full flex-1 items-center justify-center">
          <div
            aria-label="QRコード読み取りカメラ"
            className="relative isolate aspect-square w-full overflow-hidden rounded-3xl bg-[#18366B]"
            style={{
              maxWidth: "min(384px, max(160px, calc(100dvh - 380px)))",
            }}
          >
            <video
              ref={ref}
              className="absolute inset-0 h-full w-full object-cover"
              playsInline
              muted
            />

            {/* 読み取り位置の目安 */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-[12%]"
            >
              <span className="absolute top-0 left-0 h-9 w-9 rounded-tl-2xl border-t-4 border-l-4 border-[#FFBC39]" />
              <span className="absolute top-0 right-0 h-9 w-9 rounded-tr-2xl border-t-4 border-r-4 border-[#FFBC39]" />
              <span className="absolute bottom-0 left-0 h-9 w-9 rounded-bl-2xl border-b-4 border-l-4 border-[#FFBC39]" />
              <span className="absolute right-0 bottom-0 h-9 w-9 rounded-br-2xl border-r-4 border-b-4 border-[#FFBC39]" />
            </div>

            {/* 読み取り後の処理中表示 */}
            {isProcessing && (
              <div
                role="status"
                className="absolute inset-0 flex items-center justify-center bg-[#18366B]/80"
              >
                <p className="rounded-full bg-[#FFFCF3] px-5 py-3 text-sm font-bold">
                  確認しています...
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 手入力への入口 */}
        <button
          type="button"
          aria-haspopup="dialog"
          onClick={() => manualDialogRef.current?.showModal()}
          className="mt-4 min-h-12 w-full max-w-sm shrink-0 rounded-2xl border border-[#18366B]/20 bg-white px-4 py-3 text-sm font-bold transition-colors hover:bg-[#E4F2EE] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#18366B]"
        >
          カメラが使えないとき
        </button>
      </main>

      <Footer />

      {/* 手入力ダイアログ */}
      <dialog
        ref={manualDialogRef}
        aria-labelledby="manual-entry-title"
        aria-describedby="manual-entry-description"
        className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-sm overflow-y-auto rounded-3xl border-0 bg-[#FFFCF3] p-6 text-[#18366B] shadow-xl backdrop:bg-[#18366B]/50"
      >
        {/* ダイアログの見出しと閉じるボタン */}
        <div className="flex items-center justify-between gap-3">
          <h2
            id="manual-entry-title"
            className="text-lg font-extrabold"
          >
            カメラが使えないとき
          </h2>

          <button
            type="button"
            onClick={() => manualDialogRef.current?.close()}
            className="min-h-11 shrink-0 rounded-xl bg-[#E4F2EE] px-3 text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#18366B]"
          >
            閉じる
          </button>
        </div>

        <p
          id="manual-entry-description"
          className="mt-4 text-sm leading-relaxed"
        >
          近くのスタッフに声をかけてね。
          <br />
          パスワードを教えてもらったら入力してね。
        </p>

        <form
          className="mt-5 flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void handlePasswordSubmit();
          }}
        >
          {/* スタッフから案内されたパスワード */}
          <label
            htmlFor="qr-password"
            className="text-sm font-bold"
          >
            パスワード
          </label>

          <input
            id="qr-password"
            type="text"
            placeholder="パスワードを入力"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoCapitalize="none"
            spellCheck={false}
            enterKeyHint="go"
            disabled={isProcessing}
            aria-invalid={Boolean(errorMsg)}
            aria-describedby={errorMsg ? "qr-password-error" : undefined}
            className="min-h-14 w-full rounded-2xl border border-[#18366B]/20 bg-white px-4 py-3 text-center text-base placeholder:text-[#65748B] focus:border-[#269D9C] focus:outline-none focus:ring-2 focus:ring-[#269D9C]/25 disabled:opacity-60"
          />

          {/* 入力エラー */}
          {errorMsg && (
            <p
              id="qr-password-error"
              role="alert"
              className="text-sm font-bold text-[#B42332]"
            >
              {errorMsg}
            </p>
          )}

          <button
            type="submit"
            disabled={isProcessing}
            className="mt-1 min-h-14 rounded-2xl bg-[#FFBC39] px-4 py-3 font-extrabold transition-colors hover:bg-[#FFB020] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#18366B] disabled:opacity-60"
          >
            送信する
          </button>
        </form>
      </dialog>
    </>
  );
}