// components/event-phases.tsx
/* eslint-disable @next/next/no-img-element */
import React from "react";

// ① 画像表示コンポーネント (イベント画像＋たまご)
export function EventImage({
  totalScans,
  eggImagePath,
  patternImagePath,
  eventImageSrc,
  showEggOnly = false,
}: {
  totalScans: number;
  eggImagePath: string;
  patternImagePath: string;
  eventImageSrc: string;
  showEggOnly?: boolean;
}) {
  // 設定に応じて、イベント画像を使わず現在のたまごを表示する
  if (showEggOnly) {
    return (
      <div className="relative mx-auto flex h-full w-full max-w-[240px] min-h-0 items-center justify-center">
        <img
          src={eggImagePath}
          alt="現在のたまご"
          className="h-[92%] w-[92%] object-contain drop-shadow-md"
        />
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex h-full w-full max-w-[240px] min-h-0 justify-center">
      {totalScans === 3 && (
        <img src={eggImagePath} alt="たまご" className="absolute inset-0 m-auto h-full w-full object-contain" />
      )}
      {totalScans === 4 && (
        <>
          <img src={eggImagePath} alt="たまご" className="absolute inset-0 m-auto h-full w-full object-contain" />
          <img src={patternImagePath} alt="模様" className="absolute inset-0 m-auto h-full w-full object-contain" />
        </>
      )}
      <img src={eventImageSrc} alt="イベント画像" className="relative z-10 h-full w-full object-contain" />
    </div>
  );
}

// ② タイトル画面コンポーネント
export function TitlePhase({
  eventTitle,
  speakerName,
  onNext,
  children,
}: {
  eventTitle: string;
  speakerName?: string;
  onNext: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="text-center animate-in fade-in duration-300">
      {children}
      {speakerName ? (
        <div className="relative mb-8 rounded-3xl border-2 border-[#18366B]/10 bg-white px-5 py-4 text-left shadow-sm">
          <span className="absolute -top-3 left-5 rounded-full bg-[#18366B] px-3 py-1 text-xs font-extrabold text-white">
            {speakerName}
          </span>
          {/* <span aria-hidden="true" className="absolute -top-2 left-10 h-4 w-4 rotate-45 border-t-2 border-l-2 border-[#18366B]/10 bg-white" /> */}
          <h1 className="mt-1 text-xl leading-relaxed font-extrabold text-[#18366B]">
            「{eventTitle}」
          </h1>
        </div>
      ) : (
        <h1 className="mb-8 text-2xl leading-relaxed font-bold text-gray-800">
          {eventTitle}
        </h1>
      )}
      <button
        onClick={onNext}
        className="w-full rounded-xl bg-[#FFBC39] px-4 py-4 font-bold text-white transition-colors hover:bg-blue-700 active:scale-95 shadow-md"
      >
        次へ進む
      </button>
    </div>
  );
}

// ③ 質問画面コンポーネント
// プレイヤーごとの回答画面
export function QuestionPhase({
  nicknames,
  currentPlayerIndex,
  question,
  speakerName,
  useChoiceColors = false,
  choices,
  selectedAnswer,
  isEditing,
  isUpdating,
  onChoiceClick,
  onPrevious,
  onNext,
  children,
}: {
  nicknames: string[];
  currentPlayerIndex: number;
  question: string;
  speakerName?: string;
  useChoiceColors?: boolean;
  choices: string[];
  selectedAnswer?: number;
  isEditing: boolean;
  isUpdating: boolean;
  onChoiceClick: (index: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  children: React.ReactNode;
}) {
  const currentName = nicknames[currentPlayerIndex];
  const isLastPlayer = currentPlayerIndex === nicknames.length - 1;
  const lightChoiceStyles = [
    { box: "border-[#E87991] bg-[#FDE8ED]", badge: "bg-[#EF5B78] text-white" },
    { box: "border-[#68BBD5] bg-[#E5F4FA]", badge: "bg-[#3AA5C7] text-white" },
    { box: "border-[#83B96B] bg-[#E8F4E1]", badge: "bg-[#62A64C] text-white" },
    { box: "border-[#A98BDD] bg-[#F0E9FA]", badge: "bg-[#8059C6] text-white" },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 text-[#18366B]">
      {/* 現在のプレイヤー */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="shrink-0 text-center"
      >
        <p className="text-xs font-bold text-[#65748B]">
          {currentPlayerIndex + 1}人目 / {nicknames.length}人
          {isEditing && " · 回答を変更中"}
        </p>

        <h2 className="mt-1 text-xl leading-snug font-extrabold [overflow-wrap:anywhere]">
          {currentName}さんのばん
        </h2>
      </div>

      {/* 空きスペースに応じて画像を伸縮 */}
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden">
        <div className="h-full max-h-[220px] w-full">
          {children}
        </div>
      </div>

      {/* 質問と選択肢 */}
      <fieldset
        disabled={isUpdating}
        className="min-w-0 shrink-0"
      >
        <legend className="relative mb-3 w-full rounded-2xl border-2 border-[#E2A72F]/25 bg-[#FFF0C2] px-4 pt-5 pb-3 text-left text-base leading-snug font-extrabold">
          {speakerName && (
            <span className="absolute -top-3 left-4 rounded-full bg-[#FFBC39] px-3 py-1 text-xs font-extrabold text-[#18366B]">
              {speakerName}
            </span>
          )}
          {speakerName ? `「${question}」` : question}
        </legend>

        <div className="flex flex-col gap-2">
          {choices.map((choiceText, index) => {
            const selected = selectedAnswer === index + 1;
            const selectedStyle = useChoiceColors
              ? lightChoiceStyles[index] || lightChoiceStyles[0]
              : { box: "border-[#269D9C] bg-[#E4F2EE]", badge: "bg-[#18366B] text-white" };

            return (
              <label
                key={index}
                className={`relative flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border-2 px-3 py-2.5 transition-colors ${selected
                    ? selectedStyle.box
                    : "border-[#18366B]/10 bg-white"
                  }`}
              >
                <input
                  type="radio"
                  name={`player-answer-${currentPlayerIndex}`}
                  value={index + 1}
                  checked={selected}
                  onChange={() => onChoiceClick(index)}
                  className="peer sr-only"
                />

                {/* キーボード操作時のフォーカス表示 */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-2xl peer-focus-visible:outline-2 peer-focus-visible:outline-[#18366B]"
                />

                <span
                  aria-hidden="true"
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${selected
                      ? selectedStyle.badge
                      : "bg-[#FFF0C2]"
                    }`}
                >
                  {String.fromCharCode(65 + index)}
                </span>

                <span className="flex-1 text-sm leading-snug font-bold">
                  {choiceText}
                </span>

                <span
                  aria-hidden="true"
                  className="w-4 shrink-0 font-bold"
                >
                  {selected ? "✓" : ""}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* 操作ボタンを画面内の最下部に配置 */}
      <div className="flex shrink-0 items-center gap-3 border-t border-[#18366B]/10 pt-3">
        <button
          type="button"
          onClick={onPrevious}
          disabled={isUpdating || currentPlayerIndex === 0}
          className="min-h-12 shrink-0 rounded-xl px-3 text-sm font-bold focus-visible:outline-2 focus-visible:outline-[#18366B] disabled:opacity-30"
        >
          ← 前の人
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={isUpdating || !selectedAnswer}
          className="min-h-12 flex-1 rounded-2xl bg-[#FFBC39] px-3 py-3 text-sm font-extrabold enabled:hover:bg-[#FFB020] focus-visible:outline-2 focus-visible:outline-[#18366B] disabled:bg-[#E5E7EB] disabled:text-[#65748B]"
        >
          {isEditing
            ? "確認に戻る"
            : isLastPlayer
              ? "回答を確認する"
              : "次の人へ →"}
        </button>
      </div>
    </div>
  );
}

// ④ 確認画面コンポーネント
// 全員の回答を確認し、必要な人だけ変更する
export function ConfirmPhase({
  nicknames,
  tempAnswers,
  choices,
  isUpdating,
  onConfirmSave,
  onEditPlayer,
}: {
  nicknames: string[];
  tempAnswers: Record<string, number>;
  choices: string[];
  isUpdating: boolean;
  onConfirmSave: () => void;
  onEditPlayer: (index: number) => void;
}) {
  const allAnswered =
    nicknames.length > 0 &&
    nicknames.every((name) => {
      const answer = tempAnswers[name];

      return (
        Number.isInteger(answer) &&
        answer >= 1 &&
        answer <= choices.length
      );
    });

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 text-[#18366B]">
      {/* 確認画面の見出し */}
      <div className="shrink-0 text-center">
        <h2 className="text-2xl font-extrabold">
          これでいいかな？
        </h2>

        <p className="mt-2 text-xs leading-relaxed text-[#65748B]">
          変えたいときは「変更」を押してね
        </p>
      </div>

      {/* 人数に合わせてカードの高さを配分 */}
      <div
        className="grid min-h-0 flex-1 gap-2"
        style={{
          gridTemplateRows: `repeat(
            ${Math.max(nicknames.length, 1)},
            minmax(0, 1fr)
          )`,
        }}
      >
        {nicknames.map((name, index) => {
          const answer = choices[tempAnswers[name] - 1];

          return (
            <div
              key={name}
              className="grid min-h-0 grid-cols-[1fr_auto] grid-rows-[auto_1fr_auto] gap-x-3 rounded-2xl border border-[#18366B]/10 bg-white px-4 py-3"
            >
              {/* 名前を左上に大きめに表示 */}
              <p className="col-span-2 text-base font-extrabold text-[#18366B] [overflow-wrap:anywhere]">
                {name}さん
              </p>

              {/* 選択した回答をカード中央に表示 */}
              <p className="col-span-2 self-center py-1 text-center text-lg leading-snug font-extrabold text-[#18366B] [overflow-wrap:anywhere]">
                {answer ?? "まだ選んでいません"}
              </p>

              {/* 変更ボタンを右下に配置 */}
              <button
                type="button"
                onClick={() => onEditPlayer(index)}
                disabled={isUpdating}
                aria-label={`${name}さんの回答を変更`}
                className="col-start-2 min-h-11 rounded-full bg-[#E4F2EE] px-4 py-2 text-sm font-bold text-[#18366B] transition-colors enabled:hover:bg-[#D5E9E3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#18366B] disabled:opacity-40"
              >
                変更
              </button>
            </div>
          );
        })}
      </div>

      {/* 確定ボタンを画面内の最下部に配置 */}
      <div className="shrink-0 border-t border-[#18366B]/10 pt-3">
        <button
          type="button"
          onClick={onConfirmSave}
          disabled={isUpdating || !allAnswered}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#FFBC39] px-4 py-3 text-sm font-extrabold transition-colors enabled:hover:bg-[#FFB020] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#18366B] disabled:bg-[#E5E7EB] disabled:text-[#65748B]"
        >
          {isUpdating && (
            <span
              aria-hidden="true"
              className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
            />
          )}

          {isUpdating ? "きろくしています..." : "これで決定！"}
        </button>

        {/* 保存状況を読み上げ */}
        <p role="status" className="sr-only">
          {isUpdating ? "回答を保存しています。" : ""}
        </p>
      </div>
    </div>
  );
}

// ▼ 新規追加：たまごのみを表示するコンポーネント
export function EggDisplay({
  eggImagePath,
  nestImagePath,
  patternImagePath,
  crackImagePath,
  showPattern,
  sizeClass = "max-w-[200px]",
}: {
  eggImagePath: string;
  nestImagePath?: string;
  patternImagePath: string;
  crackImagePath?: string;
  showPattern: boolean;
  sizeClass?: string;
}) {
  return (
    <div className={`relative mx-auto flex w-full ${sizeClass} aspect-square justify-center drop-shadow-lg`}>
      {nestImagePath && (
        <img src={nestImagePath} alt="たまごの巣" className="absolute inset-0 z-0 m-auto h-full w-full object-contain" />
      )}
      <img src={eggImagePath} alt="たまご" className={`absolute inset-0 z-10 m-auto h-full w-full object-contain ${nestImagePath ? "-translate-y-[12%] scale-[0.82]" : ""}`} />
      {showPattern && (
        <img src={patternImagePath} alt="模様" className={`absolute inset-0 z-20 m-auto h-full w-full object-contain ${nestImagePath ? "-translate-y-[12%] scale-[0.82]" : ""}`} />
      )}
      {crackImagePath && (
        <img src={crackImagePath} alt="たまごのひび" className={`absolute inset-0 z-30 m-auto h-full w-full object-contain ${nestImagePath ? "-translate-y-[12%] scale-[0.82]" : ""}`} />
      )}
    </div>
  );
}

// ▼ 新規追加：結果発表（様子が変わった）画面コンポーネント
// 保存後の結果画面
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
    <div className="animate-in fade-in zoom-in-95 text-center text-[#18366B] duration-500 motion-reduce:animate-none">
      {/* 完了メッセージ */}
      <h2 className="mb-3 text-3xl leading-relaxed font-extrabold">
        やったね！
      </h2>

      <p className="mb-5 text-base leading-relaxed font-bold">
        {successMessage}
      </p>

      {/* 更新後のたまご */}
      {children}

      {/* ホームへ戻る */}
      <button
        type="button"
        onClick={onFinish}
        className="mt-5 min-h-12 w-full rounded-2xl bg-[#FFBC39] px-4 py-3 font-extrabold text-[#18366B] transition-colors hover:bg-[#FFB020] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#18366B]"
      >
        ホームへ戻る
      </button>
    </div>
  );
}
