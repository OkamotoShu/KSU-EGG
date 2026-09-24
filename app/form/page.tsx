"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function FormPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // ログイン中のユーザー（UID）を取得
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ▼▼▼ GoogleフォームのURL設定 ▼▼▼
  const baseUrl = "https://docs.google.com/forms/d/e/1FAIpQLScGMxK4RFHsuD4mwCHGJ628RMiMmqA1h0Ipc0fryWrPXFBE-w/viewform";
  
  // ★ここにステップ1で調べたあなたの「質問ID」を入れます
  const entryId = "entry.1364895676"; 

  // UIDが取得できていればURLにくっつけ、なければ通常のURLにする
  const formUrl = uid
    ? `${baseUrl}?embedded=true&${entryId}=${uid}`
    : `${baseUrl}?embedded=true`;
  // ▲▲▲ ここまで ▲▲▲

  return (
    <>
      <Header />
      
      <main className="flex min-h-dvh flex-col items-center bg-[#FFFCF3] px-4 pt-24 pb-28 text-[#18366B]">
        <div className="flex w-full max-w-4xl flex-1 flex-col rounded-3xl bg-white p-4 shadow-sm sm:p-6">

          <div className="relative w-full flex-1 overflow-hidden rounded-xl bg-gray-50/50" style={{ minHeight: "75vh" }}>
            {isLoading ? (
              // UIDを取得するまでの一瞬はローディングを表示
              <div className="flex h-full items-center justify-center">
                <p className="text-sm font-bold text-[#65748B]">読み込み中...</p>
              </div>
            ) : (
              <iframe
                src={formUrl}
                className="absolute inset-0 h-full w-full border-0"
                title="アンケートフォーム"
              >
                読み込んでいます…
              </iframe>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}