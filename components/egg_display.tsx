// components/egg_display.tsx

interface EggDisplayProps {
  eggSrc: string;
  nestSrc: string;
}

export function EggDisplay({ eggSrc, nestSrc }: EggDisplayProps) {
  const showNest = !nestSrc.includes("nest_0");

  return (
    <div className="relative mx-auto flex h-full w-full flex-col items-center justify-end">
      
      {/* ▼ 巣（背面） */}
      {showNest && (
        <img
          src={nestSrc}
          alt="たまごの巣"
          // ▼ 変更: 横幅を 100% にして円の端から端まで広げ、高さも 50% に拡大
          // 安定感を出すために、位置を少しだけ下に下げています (bottom-[2%])
          className="absolute bottom-[7%] z-0 h-[50%] w-[100%] object-contain"
        />
      )}
      
      {/* ▼ たまご（前面） */}
      <img
        src={eggSrc}
        alt="たまご"
        // 巣が大きくなったので、たまごがしっかり乗っているように見えるよう
        // 巣がある時の沈み込みを少しだけ深く(mb-[20%])調整しました
        className={`relative z-10 h-[80%] w-[80%] object-contain drop-shadow-md ${
          showNest ? "mb-[20%]" : "mb-[5%]" 
        }`}
      />
      
    </div>
  );
}