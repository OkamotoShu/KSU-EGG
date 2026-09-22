"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  ChevronRight,
  Map,
  MapPin,
  QrCode,
  ScanLine,
  Sparkles,
} from "lucide-react";

interface TutorialModalProps {
  onClose: () => void;
}

const steps = [
  {
    title: "QRコードを探そう！",
    description: "マップのしるしを見て、その場所でQRコードを探してね。",
    background: "#E4F2EE",
  },
  {
    title: "こたえを選ぼう！",
    description: "QRを読み取ったら質問に答えてね。選んだこたえで、たまごが変わるよ。",
    background: "#FFF0C2",
  },
  {
    title: "どんな子がうまれるかな？",
    description: "すべてのQRを見つけて、たまごをふかさせよう！",
    background: "#EDE4FF",
  },
];

export function TutorialModal({ onClose }: TutorialModalProps) {
  const [step, setStep] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const navigationLockRef = useRef(0);

  const currentStep = steps[step];
  const isLastStep = step === steps.length - 1;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    // 背景のスクロールを止める
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    if (!dialog.open) {
      dialog.showModal();
    }

    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  // 連打による意図しないページ送りを防ぐ
  const changeStep = (nextStep: number) => {
    if (Date.now() < navigationLockRef.current) return;
    if (nextStep < 0 || nextStep >= steps.length) return;

    navigationLockRef.current = Date.now() + 400;
    setStep(nextStep);
  };

  const handleNext = () => {
    if (Date.now() < navigationLockRef.current) return;

    if (isLastStep) {
      navigationLockRef.current = Date.now() + 400;
      onClose();
    } else {
      changeStep(step + 1);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="tutorial-heading"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-sm overflow-y-auto rounded-[2rem] border border-[#18366B]/10 bg-[#FFFCF3] p-5 text-[#18366B] shadow-xl backdrop:bg-[#18366B]/45 backdrop:backdrop-blur-sm"
    >
      {/* 教程の見出し */}
      <div className="mb-3 flex items-center justify-between">
        <h2 id="tutorial-heading" className="text-lg font-extrabold">
          あそびかた
        </h2>

        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold">
          {step + 1} / {steps.length}
        </span>
      </div>

      {/* ステップごとのイラスト */}
      <div
        aria-hidden="true"
        className="relative flex h-[clamp(100px,26dvh,220px)] items-center justify-center overflow-hidden rounded-3xl transition-colors duration-300 motion-reduce:transition-none"
        style={{ backgroundColor: currentStep.background }}
      >
        <div
          key={step}
          className="relative flex h-full w-full animate-in items-center justify-center fade-in duration-300 motion-reduce:animate-none"
        >
          {step === 0 && (
            <div className="flex h-full w-full items-center justify-center gap-2 px-4">
              {/* 地図上の目印 */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative flex h-20 w-24 items-center justify-center rounded-2xl bg-white">
                  <Map
                    className="h-16 w-16 text-[#269D9C]"
                    strokeWidth={1.5}
                  />

                  <MapPin
                    className="absolute top-1 right-3 h-9 w-9 fill-[#EF3438] text-white"
                    strokeWidth={2}
                  />
                </div>

                <span className="text-xs font-extrabold">
                  マップのしるし
                </span>
              </div>

              {/* 目印の場所へ向かう道 */}
              <div className="flex w-8 shrink-0 items-center pb-6 text-[#18366B]">
                <span className="h-0 flex-1 border-t-2 border-dashed border-[#18366B]/40" />
                <ChevronRight
                  aria-hidden="true"
                  className="-ml-1 h-4 w-4 shrink-0"
                  strokeWidth={3}
                />
              </div>

              {/* 現地で探すQRコードのイメージ */}
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-[#FFBC39] bg-white">
                  <QrCode
                    className="h-14 w-14 text-[#18366B]"
                    strokeWidth={2}
                  />
                </div>

                <span className="text-xs font-extrabold">
                  QRを発見！
                </span>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="flex h-full w-full items-center justify-center gap-2 px-4">
              {/* 質問に答えるイメージ */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-28 rounded-2xl border border-[#18366B]/10 bg-white p-2.5">
                  <p className="mb-2 text-center text-xs font-extrabold">
                    どれがすき？
                  </p>

                  <div className="flex flex-col gap-1.5">
                    <div className="rounded-lg border border-[#18366B]/10 px-2 py-1 text-xs">
                      あか
                    </div>

                    <div className="flex items-center justify-between rounded-lg border-2 border-[#269D9C] bg-[#E4F2EE] px-2 py-1 text-xs font-bold">
                      <span>あお</span>
                      <span>✓</span>
                    </div>

                    <div className="rounded-lg border border-[#18366B]/10 px-2 py-1 text-xs">
                      きいろ
                    </div>
                  </div>
                </div>

                <span className="text-xs font-extrabold">
                  こたえを選ぶ
                </span>
              </div>

              {/* 回答によって変化することを示す矢印 */}
              <span className="shrink-0 pb-6 text-xl font-extrabold">
                →
              </span>

              {/* 青色に変わったたまごの説明用イラスト */}
              <div className="flex flex-col items-center gap-2">
                <div className="relative flex h-32 w-24 items-center justify-center">
                  <div className="relative h-24 w-[72px] overflow-hidden rounded-[50%_50%_45%_45%/60%_60%_40%_40%] border-2 border-[#18366B]/20 bg-[#A9DDF5]">
                    <span className="absolute top-5 left-3 h-5 w-3 -rotate-12 rounded-full bg-white/70" />
                    <span className="absolute right-2 bottom-5 h-5 w-5 rounded-full bg-[#69B9DF]" />
                    <span className="absolute bottom-3 left-3 h-3 w-3 rounded-full bg-[#69B9DF]" />
                  </div>

                  <Sparkles className="absolute top-1 right-0 h-6 w-6 text-[#A96500]" />
                </div>

                <span className="text-xs font-extrabold">
                  たまごが変わる！
                </span>
              </div>
            </div>
          )}

          {step === 2 && (
            <>
              {/* 何が生まれるか楽しみにするたまご */}
              <div className="relative flex h-40 w-32 items-center justify-center">
                <div className="relative h-30 w-[88px] overflow-hidden rounded-[50%_50%_45%_45%/60%_60%_40%_40%] border-2 border-[#18366B]/20 bg-[#A9DDF5]">
                  <span className="absolute top-5 left-3 h-5 w-3 -rotate-12 rounded-full bg-white/70" />
                  <span className="absolute right-2 bottom-5 h-5 w-5 rounded-full bg-[#69B9DF]" />
                  <span className="absolute bottom-3 left-3 h-3 w-3 rounded-full bg-[#69B9DF]" />
                </div>

                <Sparkles className="absolute top-1 right-0 h-6 w-6 text-[#A96500]" />
              </div>

              {/* たまごの中央に疑問符を表示 */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="text-6xl leading-none font-extrabold text-[#18366B] [text-shadow:0_2px_0_#FFFFFF,0_-2px_0_#FFFFFF,2px_0_0_#FFFFFF,-2px_0_0_#FFFFFF]">
                  ?
                </span>
              </div>

              <Sparkles className="absolute bottom-[20%] left-[16%] h-6 w-6 text-[#A96500]" />
            </>
          )}
        </div>
      </div>

      {/* 短い説明文 */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="py-4 text-center"
      >
        <h3 className="text-xl leading-snug font-extrabold">
          {currentStep.title}
        </h3>

        <p className="mt-2 text-sm leading-relaxed">
          {currentStep.description}
        </p>
      </div>

      {/* 現在のステップ */}
      <div aria-hidden="true" className="mb-4 flex justify-center gap-2">
        {steps.map((_, index) => (
          <span
            key={index}
            className={`h-2 rounded-full transition-all motion-reduce:transition-none ${index === step
              ? "w-6 bg-[#18366B]"
              : "w-2 bg-[#18366B]/20"
              }`}
          />
        ))}
      </div>

      {/* 前へ・次への操作 */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => changeStep(step - 1)}
          disabled={step === 0}
          className="min-h-12 rounded-2xl px-4 py-3 text-sm font-bold focus-visible:outline-2 focus-visible:outline-[#18366B] disabled:opacity-30"
        >
          戻る
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="min-h-12 flex-1 rounded-2xl bg-[#FFBC39] px-4 py-3 text-sm font-extrabold transition-colors hover:bg-[#FFB020] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#18366B]"
        >
          {isLastStep ? "はじめる！" : "次へ →"}
        </button>
      </div>
    </dialog>
  );
}