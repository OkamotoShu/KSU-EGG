// components/egg_display.tsx
/* eslint-disable @next/next/no-img-element */

interface EggDisplayProps {
  eggSrc: string;
  nestSrc: string;
  patternSrc: string;
}

export function EggDisplay({ eggSrc, nestSrc, patternSrc }: EggDisplayProps) {
  const showNest = !nestSrc.includes("nest_0");
  const showPattern = !patternSrc.includes("pattern_0");

  return (
    <div className="relative mx-auto flex h-full w-full flex-col items-center justify-end">
      
      {/* 巣（最背面 z-0） */}
      {showNest && (
        <img
          src={nestSrc}
          alt="たまごの巣"
          className="absolute bottom-[2%] z-0 h-[50%] w-[100%] object-contain"
        />
      )}
      
      {/* たまご・模様を配置するコンテナ */}
      <div
        className={`relative z-10 h-[80%] w-[80%] flex justify-center items-center ${
          showNest ? "mb-[20%]" : "mb-[5%]" 
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
      </div>
      
    </div>
  );
}