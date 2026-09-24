// app/register/page.tsx
"use client";

import { useState, Suspense } from "react"; // ▼ Suspense を追加
import { useRouter, useSearchParams } from "next/navigation"; // ▼ useSearchParams を追加
import { auth, db } from "@/lib/firebase";
import { signInAnonymously } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { Header } from "@/components/header";
import { postCollectionInLogs } from "@/lib/dbActions";
import { ChevronDown } from "lucide-react";
import { EntryGuard } from "@/components/entry-guard";
import { serverTimestamp } from "firebase/firestore"; // ←上部にインポート追加

function RegisterContent() {
  const [playerCount, setPlayerCount] = useState<number>(1);
  const [nicknames, setNicknames] = useState<string[]>([""]);
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams(); // ▼ 追加: URLのパラメータを取得
  const redirectUrl = searchParams.get("redirect"); // ▼ 追加: "redirect" の値を取り出す

  const handlePlayerCountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const count = parseInt(e.target.value, 10);
    setPlayerCount(count);

    setNicknames((prev) => {
      const newNicknames = [...prev];
      if (count > prev.length) {
        for (let i = prev.length; i < count; i++) {
          newNicknames.push("");
        }
      } else {
        newNicknames.length = count;
      }
      return newNicknames;
    });
  };

  const handleNicknameChange = (index: number, value: string) => {
    setNicknames((prev) => {
      const newNicknames = [...prev];
      newNicknames[index] = value;
      return newNicknames;
    });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLoading) return; // 連打防止

    if (nicknames.some((name) => !name.trim())) {
      alert("すべてのニックネームを入力してください。");
      return;
    }

    const uniqueNames = new Set(nicknames.map((name) => name.trim()));
    if (uniqueNames.size !== nicknames.length) {
      alert("ニックネームはそれぞれ別のものを入力してください。");
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await signInAnonymously(auth);
      const user = userCredential.user;

      const nickNameMap: Record<string, number[]> = {};
      nicknames.forEach((name) => {
        nickNameMap[name.trim()] = [0, 0, 0, 0, 0];
      });

      await setDoc(doc(db, "users", user.uid), {
        player: playerCount,
        nickName: nickNameMap,
        orderedNames: nicknames.map((name) => name.trim()),
        dev: 0,
        scannedQRs: [0, 0, 0, 0, 0, 0],
        createdAt: new Date(),
      });

      // ▼ 追加: 2. ここでsignature（同意記録）も一緒に保存する
      await setDoc(doc(db, "signature", user.uid), {
        uid: user.uid,
        date: serverTimestamp(),
        userAgent: navigator.userAgent, // ブラウザ情報（同意の証拠力アップ）
      });

      // ▼ 追加: 3. 一時メモはお役御免なので消去する
      sessionStorage.removeItem("terms_agreed");

      await postCollectionInLogs("アプリ登録", "登録画面", "成功");

      // ▼ 変更: 登録完了後の遷移先を条件分岐
      if (redirectUrl) {
        router.replace(redirectUrl); // QRコードから来た場合はイベント画面に戻す
      } else {
        router.replace("/"); // 通常アクセスの場合はホーム画面へ
      }
    } catch (error) {
      await postCollectionInLogs("アプリ登録", "登録画面", `失敗: ${error}`);
      console.error("登録エラー:", error);
      alert("登録に失敗しました。もう一度お試しください。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header />

      <main className="flex min-h-dvh flex-col items-center bg-[#FFFCF3] px-5 pt-28 pb-8 text-[#18366B]">
        <div className="my-auto w-full max-w-sm">
          {/* ページタイトル */}
          <div className="mb-6 text-center">
            <p className="mb-2 text-xs font-extrabold tracking-[0.16em] text-[#A96500]">
              MY LITTLE ADVENTURE
            </p>

            <h1 className="text-3xl font-extrabold">ゲームのじゅんび</h1>

            <p className="mt-3 text-sm leading-relaxed">
              あそぶ人数となまえを教えてね
            </p>
          </div>

          {/* 参加者の登録フォーム */}
          <form
            onSubmit={handleRegister}
            aria-busy={isLoading}
            className="rounded-3xl border border-[#18366B]/10 bg-white/80 p-5 sm:p-6"
          >
            <fieldset
              disabled={isLoading}
              className="flex min-w-0 flex-col gap-6 disabled:opacity-60"
            >
              <legend className="sr-only">参加者の情報</legend>

              {/* 一緒に遊ぶ人数 */}
              <div>
                <label
                  htmlFor="player-count"
                  className="mb-3 flex items-center gap-2 text-base font-bold"
                >
                  <span
                    aria-hidden="true"
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E4F2EE] text-sm"
                  >
                    1
                  </span>
                  あそぶ人数
                </label>

                {/* 標準の矢印を非表示にし、大きなアイコンを配置 */}
                <div className="relative">
                  <select
                    id="player-count"
                    value={playerCount}
                    onChange={handlePlayerCountChange}
                    className="min-h-14 w-full appearance-none rounded-2xl border border-[#18366B]/20 bg-[#FFFCF3] py-3 pr-14 pl-4 text-base font-bold focus:border-[#269D9C] focus:outline-none focus:ring-2 focus:ring-[#269D9C]/25"
                  >
                    {[1, 2, 3, 4].map((num) => (
                      <option key={num} value={num}>
                        {num}人
                      </option>
                    ))}
                  </select>

                  <ChevronDown
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 right-4 h-7 w-7 -translate-y-1/2 text-[#18366B]"
                    strokeWidth={2.5}
                  />
                </div>
              </div>

              {/* 各プレイヤーのニックネーム */}
              <div>
                <h2 className="mb-2 flex items-center gap-2 text-base font-bold">
                  <span
                    aria-hidden="true"
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FFF0C2] text-sm"
                  >
                    2
                  </span>
                  ニックネーム
                </h2>

                <p
                  id="nickname-hint"
                  className="mb-4 text-xs leading-relaxed text-[#65748B]"
                >
                  10文字まで。同じなまえは使えないよ。
                </p>

                <div className="flex flex-col gap-4">
                  {nicknames.map((name, index) => (
                    <div key={index}>
                      <label
                        htmlFor={`nickname-${index}`}
                        className="mb-2 block text-sm font-bold"
                      >
                        {index + 1}人目のなまえ
                      </label>

                      <input
                        id={`nickname-${index}`}
                        type="text"
                        required
                        maxLength={10}
                        value={name}
                        onChange={(event) =>
                          handleNicknameChange(index, event.target.value)
                        }
                        aria-describedby="nickname-hint"
                        placeholder="なまえを入力"
                        autoComplete="off"
                        className="min-h-14 w-full rounded-2xl border border-[#18366B]/20 bg-[#FFFCF3] px-4 py-3 text-base placeholder:text-[#65748B] focus:border-[#269D9C] focus:outline-none focus:ring-2 focus:ring-[#269D9C]/25"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* 登録してゲームを開始 */}
              <button
                type="submit"
                disabled={isLoading}
                className="min-h-14 w-full rounded-2xl bg-[#FFBC39] px-4 py-3 text-base font-extrabold transition-colors hover:bg-[#FFB020] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#18366B] disabled:cursor-wait"
              >
                {isLoading ? "じゅんび中..." : "ゲームをはじめる"}
              </button>
            </fieldset>

            <p role="status" className="sr-only">
              {isLoading ? "じゅんび中です。少し待ってね。" : ""}
            </p>
          </form>
        </div>
      </main>
    </>
  );
}

// ▼ 変更: useSearchParams を使うため Suspense でラップする
export default function RegisterPage() {
  return (
    <EntryGuard page="register">
      <Suspense fallback={
        <div className="flex min-h-dvh items-center justify-center bg-[#FFFCF3]">
          <p className="text-[#18366B] font-bold">読み込み中...</p>
        </div>
      }>
        <RegisterContent />
      </Suspense>
    </EntryGuard>
  );
}