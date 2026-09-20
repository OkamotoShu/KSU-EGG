// app/register/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { signInAnonymously } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { Header } from "@/components/header";

export default function RegisterPage() {
  const [playerCount, setPlayerCount] = useState<number>(1);
  const [nicknames, setNicknames] = useState<string[]>([""]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

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
    
    if (nicknames.some((name) => !name.trim())) {
      alert("すべてのニックネームを入力してください。");
      return;
    }

    const uniqueNames = new Set(nicknames.map(name => name.trim()));
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

      // ▼ ここで dev: 0 を追加しています
      await setDoc(doc(db, "users", user.uid), {
        player: playerCount,
        nickName: nickNameMap,
        orderedNames: nicknames.map(name => name.trim()),
        dev: 0, 
        scannedQRs: [0, 0, 0, 0, 0, 0],
        createdAt: new Date(),
      });

      router.push("/");
    } catch (error) {
      console.error("登録エラー:", error);
      alert("登録に失敗しました。もう一度お試しください。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="flex min-h-dvh flex-col items-center justify-center bg-gray-50 pt-20 pb-24 px-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-md">
          <h1 className="mb-6 text-center text-2xl font-bold text-blue-600">
            ゲームのじゅんび
          </h1>

          <form onSubmit={handleRegister} className="flex flex-col gap-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                あそぶ人数
              </label>
              <select
                value={playerCount}
                onChange={handlePlayerCountChange}
                className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                {[1, 2, 3, 4].map((num) => (
                  <option key={num} value={num}>
                    {num} 人
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-4">
              <label className="block text-sm font-medium text-gray-700">
                ニックネーム
              </label>
              {nicknames.map((name, index) => (
                <div key={index}>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={name}
                    onChange={(e) => handleNicknameChange(index, e.target.value)}
                    placeholder={`プレイヤー ${index + 1} のなまえ`}
                    className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 rounded-lg bg-blue-600 p-3 font-bold text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isLoading ? "じゅんび中..." : "ゲームをはじめる"}
            </button>
          </form>
        </div>
      </main>
    </>
  );
}