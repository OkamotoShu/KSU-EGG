// components/event-phases.tsx
/* eslint-disable @next/next/no-img-element */
import React from "react";

// ① 画像表示コンポーネント (イベント画像＋たまご)
export function EventImage({
  totalScans,
  eggImagePath,
  patternImagePath,
  eventImageSrc,
}: {
  totalScans: number;
  eggImagePath: string;
  patternImagePath: string;
  eventImageSrc: string;
}) {
  return (
    <div className="mb-6 relative mx-auto flex w-full max-w-[240px] justify-center">
      {totalScans === 3 && (
        <img src={eggImagePath} alt="たまご" className="absolute inset-0 m-auto h-full w-full object-contain" />
      )}
      {totalScans === 4 && (
        <>
          <img src={eggImagePath} alt="たまご" className="absolute inset-0 m-auto h-full w-full object-contain" />
          <img src={patternImagePath} alt="模様" className="absolute inset-0 m-auto h-full w-full object-contain" />
        </>
      )}
      <img src={eventImageSrc} alt="イベント画像" className="relative z-10 w-full object-contain drop-shadow-md" />
    </div>
  );
}

// ② タイトル画面コンポーネント
export function TitlePhase({
  eventTitle,
  onNext,
  children,
}: {
  eventTitle: string;
  onNext: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="text-center animate-in fade-in duration-300">
      {children}
      <h1 className="mb-8 text-2xl font-bold text-gray-800 leading-relaxed">
        {eventTitle}
      </h1>
      <button
        onClick={onNext}
        className="w-full rounded-xl bg-blue-600 px-4 py-4 font-bold text-white transition-colors hover:bg-blue-700 active:scale-95 shadow-md"
      >
        次へ進む
      </button>
    </div>
  );
}

// ③ 質問画面コンポーネント
export function QuestionPhase({
  nicknames,
  currentPlayerIndex,
  question,
  choices,
  onChoiceClick,
  children,
}: {
  nicknames: string[];
  currentPlayerIndex: number;
  question: string;
  choices: string[];
  onChoiceClick: (idx: number) => void;
  children: React.ReactNode;
}) {
  const currentName = nicknames[currentPlayerIndex];
  return (
    <div className="animate-in fade-in duration-300">
      {nicknames.length > 1 && (
        <p className="mb-2 text-center text-sm font-bold text-blue-500">
          {currentPlayerIndex + 1} 人目 / {nicknames.length} 人中
        </p>
      )}
      <h2 className="mb-4 text-center text-lg font-bold text-gray-700">
        <span className="text-blue-600">{currentName}</span> のばん
      </h2>
      <div className="mb-6 h-px w-full bg-gray-200" />
      {children}
      <h1 className="mb-6 text-lg font-bold leading-relaxed text-gray-800">
        {question}
      </h1>
      <div className="flex flex-col gap-4">
        {choices.map((choiceText, idx) => (
          <button
            key={idx}
            onClick={() => onChoiceClick(idx)}
            className="rounded-xl border-2 border-blue-100 bg-blue-50 p-4 text-left font-bold text-blue-700 transition-colors hover:bg-blue-100 active:scale-95"
          >
            {choiceText}
          </button>
        ))}
      </div>
    </div>
  );
}

// ④ 確認画面コンポーネント
export function ConfirmPhase({
  nicknames,
  tempAnswers,
  choices,
  isUpdating,
  onConfirmSave,
  onRedo,
}: {
  nicknames: string[];
  tempAnswers: Record<string, number>;
  choices: string[];
  isUpdating: boolean;
  onConfirmSave: () => void;
  onRedo: () => void;
}) {
  return (
    <div className="animate-in fade-in duration-300">
      <h2 className="mb-6 text-center text-lg font-bold text-gray-800">
        これで決定していいですか？
      </h2>
      <div className="mb-8 flex flex-col gap-3">
        {nicknames.map(name => {
          const selectedIndex = tempAnswers[name] - 1;
          return (
            <div key={name} className="rounded-xl bg-gray-50 p-4 border border-gray-100">
              <p className="mb-1 text-sm font-bold text-blue-500">{name}</p>
              <p className="font-bold text-gray-700">{choices[selectedIndex]}</p>
            </div>
          );
        })}
      </div>
      <div className="flex flex-col gap-3">
        <button
          onClick={onConfirmSave}
          disabled={isUpdating}
          className="w-full rounded-xl bg-blue-600 px-4 py-4 font-bold text-white transition-colors hover:bg-blue-700 active:scale-95 disabled:bg-gray-400 shadow-md flex items-center justify-center"
        >
          {isUpdating ? (
            <>
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
              きろくしています...
            </>
          ) : (
            "はい、これで決定！"
          )}
        </button>
        <button
          onClick={onRedo}
          disabled={isUpdating}
          className="w-full rounded-xl bg-gray-100 px-4 py-4 font-bold text-gray-600 transition-colors hover:bg-gray-200 active:scale-95 disabled:opacity-50"
        >
          やり直す
        </button>
      </div>
    </div>
  );
}

// ▼ 新規追加：たまごのみを表示するコンポーネント
export function EggDisplay({
  eggImagePath,
  patternImagePath,
  showPattern,
  sizeClass = "max-w-[200px]",
}: {
  eggImagePath: string;
  patternImagePath: string;
  showPattern: boolean;
  sizeClass?: string;
}) {
  return (
    <div className={`relative mx-auto flex w-full ${sizeClass} aspect-square justify-center drop-shadow-lg`}>
      <img src={eggImagePath} alt="たまご" className="absolute inset-0 m-auto h-full w-full object-contain" />
      {showPattern && (
        <img src={patternImagePath} alt="模様" className="absolute inset-0 m-auto h-full w-full object-contain" />
      )}
    </div>
  );
}

// ▼ 新規追加：結果発表（様子が変わった）画面コンポーネント
export function SuccessPhase({
  successMessage,
  onFinish,
  children,
}: {
  successMessage: string;
  onFinish: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="text-center animate-in zoom-in-95 fade-in duration-500">
      <h2 className="mb-2 text-2xl font-bold text-blue-600 leading-relaxed">
        やったね！
      </h2>
      <p className="mb-6 font-bold text-gray-700 leading-relaxed">
        {successMessage}
      </p>
      
      {children}
      
      <button
        onClick={onFinish}
        className="mt-6 w-full rounded-xl bg-green-500 px-4 py-4 font-bold text-white transition-colors hover:bg-green-600 active:scale-95 shadow-md"
      >
        ホームへ戻る
      </button>
    </div>
  );
}