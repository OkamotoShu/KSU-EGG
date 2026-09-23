"use client";
// components/egg_display.tsx
/* eslint-disable @next/next/no-img-element */

interface EggDisplayProps {
  eggSrc: string;
  nestSrc: string;
  patternSrc: string;
  auraSrc?: string;
  markType?: 1 | 2 | 3;
}

export function EggDisplay({ eggSrc, nestSrc, patternSrc, auraSrc, markType }: EggDisplayProps) {
  const showNest = !nestSrc.includes("nest_0");
  const showPattern = !patternSrc.includes("pattern_0");
  const showAura = auraSrc && !auraSrc.includes("aura_0");

  // たまごと模様だけを揺らす
  const handleEggClick = (element: HTMLButtonElement) => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    element.getAnimations().forEach((animation) => animation.cancel());

    element.animate(
      [
        { transform: "rotate(0deg)" },
        { transform: "rotate(-7deg)", offset: 0.2 },
        { transform: "rotate(6deg)", offset: 0.4 },
        { transform: "rotate(-4deg)", offset: 0.6 },
        { transform: "rotate(2deg)", offset: 0.8 },
        { transform: "rotate(0deg)" },
      ],
      {
        duration: 800,
        easing: "ease-in-out",
      }
    );
  };

  return (
    <div className="relative mx-auto flex h-full w-full flex-col items-center justify-end">

      {/* 巣（最背面 z-0） */}
      {showNest && (
        <img
          src={nestSrc}
          alt="たまごの巣"
          className="absolute bottom-[2%] z-0 h-[80%] w-[80%] object-contain"
        />
      )}

      {showAura && (
          <img
            src={auraSrc}
            alt="オーラ"
            className="absolute inset-0 m-auto z-0 h-[100%] w-[100%] object-contain pointer-events-none"
          />
        )}

      {/* たまご・模様を配置するコンテナ */}
      {/* 巣を動かさず、たまごと模様だけを揺らす */}
      <button
        type="button"
        onClick={(event) => handleEggClick(event.currentTarget)}
        aria-label="キャラクターを揺らす"
        className={`relative z-10 flex h-[80%] w-[80%] origin-[50%_85%] cursor-pointer touch-manipulation items-center justify-center rounded-3xl border-0 bg-transparent p-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#18366B] ${showNest ? "mb-[20%]" : "mb-[5%]"
          }`}
      >
        {/* たまご（またはモンスター）本体 */}
        <img
          src={eggSrc}
          alt="キャラクター"
          className="h-full w-full object-contain drop-shadow-md"
        />

        {/* 模様（前面 z-20） */}
        {showPattern && (
          <img
            src={patternSrc}
            alt="模様"
            className="absolute inset-0 m-auto z-20 h-[90%] w-[90%] object-contain"
          />
        )}

        {/* ARで獲得した印。種類ごとに、たまご上の異なる位置へ置く */}
        {markType === 1 && (
          <svg aria-label="こやまちゃんの星の印" viewBox="0 0 100 100" className="pointer-events-none absolute top-[29%] left-[58%] z-30 h-[15%] w-[15%] drop-shadow-sm">
            <path d="M50 5 61 36 95 37 68 57 77 91 50 71 23 91 32 57 5 37 39 36Z" fill="#FFE15A" stroke="#E99A28" strokeWidth="7" strokeLinejoin="round" />
          </svg>
        )}
        {markType === 2 && (
          <svg aria-label="むすぶくんのハートの印" viewBox="0 0 100 100" className="pointer-events-none absolute top-[42%] left-[27%] z-30 h-[16%] w-[16%] drop-shadow-sm">
            <path d="M50 88C39 75 10 58 10 32 10 11 37 6 50 25 63 6 90 11 90 32 90 58 61 75 50 88Z" fill="#FF88AA" stroke="#D9507A" strokeWidth="7" strokeLinejoin="round" />
          </svg>
        )}
        {markType === 3 && (
          <svg aria-label="やまちゃんの魔法の印" viewBox="0 0 100 100" className="pointer-events-none absolute top-[54%] left-[48%] z-30 h-[18%] w-[18%] drop-shadow-sm">
            <circle cx="50" cy="50" r="38" fill="none" stroke="#46D99A" strokeWidth="7" />
            <path d="M50 13 60 40 88 40 65 57 74 84 50 67 26 84 35 57 12 40 40 40Z" fill="none" stroke="#FFE15A" strokeWidth="6" strokeLinejoin="round" />
            <circle cx="50" cy="50" r="6" fill="#FFF4A8" />
          </svg>
        )}
      </button>
    </div>
  );
}
