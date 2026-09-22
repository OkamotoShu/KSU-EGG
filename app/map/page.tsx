"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";

// チェックアイコン位置
const pins = [
  { id: 1, x: 0, y: 0, cleared: false },
  { id: 2, x: 55, y: 25, cleared: false },
  { id: 3, x: 90, y: 65, cleared: false },
  { id: 4, x: 30, y: 40, cleared: false },
  { id: 5, x: 45, y: 25, cleared: false },
  { id: 6, x: 70, y: 65, cleared: false },
];

export default function Map() {
  // 関連画像
  const mapImage = `/mapImage.jpg`;
  const mapPin = `/mapPin.png`;
  const mapClearedPin = `/clearedPin.png`;

  return (
    <>
      <Header />

      <main className="flex min-h-dvh flex-col items-center bg-[#FFFCF3] px-5 pt-24 pb-28 text-[#18366B]">
        {/* ページタイトル */}
        <div className="mb-4 shrink-0 text-center">
          <h1 className="text-2xl font-extrabold">
            会場マップ
          </h1>
          <p className="mt-2 text-sm">
            ピンがあるところにQRコードがあるよ!
            <br />
            QRコードを見つけたらアプリで読み取ろう!
          </p>
        </div>

        {/* マップ表示 */}
        <div className="flex flex-1 w-full items-center">
          <div className="w-full overflow-x-auto overflow-y-hidden">
            <div className="min-w-max">
              <div className="relative w-max mx-auto">
                {/* マップ画像 */}
                <img
                  src={mapImage}
                  className="block h-[380px] w-auto rounded-[10px] border border-[#ccc]"
                />

                {/* イベントピン */}
                {pins.map((pin) => (
                  <img
                    key={pin.id}
                    src={pin.cleared ? mapClearedPin : mapPin}
                    className="absolute w-[40px] h-[40px] -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: `${pin.x}%`,
                      top: `${pin.y}%`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* イベント全体マップへの誘導ボタン */}
        <button
          type="button"
          onClick={() => {window.location.href = "https://www.kyoto-su.ac.jp/sjamboree_map/";}}
          className="mt-4 min-h-12 w-full max-w-sm shrink-0 rounded-2xl border border-[#18366B]/20 bg-white px-4 py-3 text-sm font-bold transition-colors hover:bg-[#E4F2EE] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#18366B]"
        >
          サタデージャンボリー デジタルマップ はこちら
        </button>
      </main>

      <Footer />
    </>
  );
}