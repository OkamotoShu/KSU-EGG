"use client";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

// チェックアイコン位置
const pins = [
  { id: 0, x: 21, y: 35, name: "総合体育館\n1階 ロビー", photo: "/qrPlace_0.jpg" },
  { id: 1, x: 56.5, y: 21, name: "神山天文台\n1階 入口", photo: "/qrPlace_1.jpg" },
  { id: 2, x: 62.5, y: 24, name: "サギタリウス館 1階\nグローバルコモンズ", photo: "/qrPlace_2.jpg" },
  { id: 3, x: 65, y: 34, name: "12号館 アーチ下\n(ピロティ前)", photo: "/qrPlace_3.jpg" },
  { id: 4, x: 36.2, y: 39, name: "神山ホール\n図書館側出口", photo: "/qrPlace_4.jpg" },
  { id: 5, x: 37, y: 43, name: "神山ホール\n図書館側出口(ゴール)", photo: "/qrPlace_5.jpg" },
];

export default function Map() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [scannedQRs, setScannedQRs] = useState<number[]>([]);  // QR読み取り状態監視
  const [selectedPin, setSelectedPin] = useState<typeof pins[0] | null>(null);
  
  // 関連画像
  const mapImage = `/mapImage.jpg`;
  const mapPin = `/mapPin.png`;
  const mapClearedPin = `/clearedPin.png`;
  const mapGoalPin = `/mapGoalPin.png`;

  useEffect(() => {
    const fetchScannedQRs = async (user: User) => {
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          router.push("/register");
          return;
        }

        const data = userSnap.data();

        const scannedQRs: number[] = data.scannedQRs || [0, 0, 0, 0, 0, 0];

        setScannedQRs(scannedQRs);
        setIsLoading(false);
      } catch (error) {
        console.error("scannedQRs取得エラー:", error);
      }
    };
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchScannedQRs(user);
      } else {
        router.push("/register");
      }
    });

    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />;
  }

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
                  <button
                    key={pin.id}
                    onClick={() => setSelectedPin(pin)} // ◀ 追加：タップでピン情報をセット
                    className="absolute -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-110 active:scale-90"
                    style={{
                      left: `${pin.x}%`,
                      top: `${pin.y}%`,
                    }}
                  >
                    <img
                      src={
                        scannedQRs[pin.id] === 1
                          ? mapClearedPin
                          : pin.id === 5
                          ? mapGoalPin
                          : mapPin
                      }
                      className="h-[40px] w-[40px]"
                      alt={pin.name}
                    />
                  </button>
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

      {selectedPin && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-[#18366B]/40 px-5 backdrop-blur-sm"
          onClick={() => setSelectedPin(null)} // 背景タップで閉じる
        >
          <div 
            className="w-full max-w-sm overflow-hidden rounded-3xl bg-[#FFFCF3] p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()} // 白い枠内のタップでは閉じないようにする
          >
            {/* 写真 */}
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-white/50 shadow-inner">
              <img 
                src={selectedPin.photo} 
                alt={selectedPin.name} 
                className="h-full w-full object-cover"
              />
            </div>
            
            {/* 場所の名前 */}
            <h2 className="mt-4 text-center text-xl font-extrabold leading-snug text-[#18366B] whitespace-pre-wrap">
              {selectedPin.name}
            </h2>
            
            {/* 閉じるボタン */}
            <button
              onClick={() => setSelectedPin(null)}
              className="mt-6 min-h-12 w-full rounded-2xl bg-[#E5E7EB] px-4 font-bold text-[#65748B] transition active:scale-95"
            >
              閉じる
            </button>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}