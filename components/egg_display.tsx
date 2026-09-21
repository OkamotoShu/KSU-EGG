// components/egg_display.tsx
/* eslint-disable @next/next/no-img-element */

interface EggDisplayProps {
  eggSrc: string;
  nestSrc: string;
  patternSrc: string;
  placeholderText?: string; // ▼ 追加: 仮表示用のテキスト（オプション）
}

export function EggDisplay({ eggSrc, nestSrc, patternSrc, placeholderText }: EggDisplayProps) {
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
      
      {/* たまご・模様・仮テキストを配置するコンテナ */}
      <div
        className={`relative z-10 h-[80%] w-[80%] flex justify-center items-center ${
          showNest ? "mb-[20%]" : "mb-[5%]" 
        }`}
      >
        {/* ▼ 変更: テキストが指定されていればテキスト枠を、無ければ画像を出す */}
        {placeholderText ? (
          <div className="flex h-[80%] w-[80%] items-center justify-center rounded-2xl bg-gray-200 bg-opacity-90 p-4 text-center text-sm font-bold text-gray-600 shadow-inner whitespace-pre-wrap">
            {placeholderText}
          </div>
        ) : (
          <img
            src={eggSrc}
            alt="たまご"
            className="h-full w-full object-contain drop-shadow-md"
          />
        )}
        
        {/* 模様（たまごの前面 z-20） */}
        {showPattern && !placeholderText && ( // 仮表示のときは模様も出さない
          <img
            src={patternSrc}
            alt="たまごの模様"
            className="absolute inset-0 m-auto z-20 h-[75%] w-[75%] object-contain"
          />
        )}
      </div>
      
    </div>
  );
}