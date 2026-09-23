"use client";
// components/egg_display.tsx
/* eslint-disable @next/next/no-img-element */

interface EggDisplayProps {
  eggSrc: string;
  nestSrc: string;
  patternSrc: string;
  auraSrc?: string;
}

export function EggDisplay({ eggSrc, nestSrc, patternSrc, auraSrc }: EggDisplayProps) {
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
      </button>
    </div>
  );
}