// components/home-skeleton.tsx
export function HomeSkeleton() {
  return (
    <div className="flex w-full max-w-md flex-col items-center px-4">
      {/* ユーザー名や切り替えタブなどの骨組み */}
      <div className="mt-2 mb-6 h-8 w-48 rounded-full bg-[#18366B]/10 animate-pulse" />

      {/* メインのたまご/キャラクター表示エリアの骨組み */}
      <div className="relative mb-8 flex aspect-square w-full max-w-[280px] items-center justify-center rounded-[2.5rem] bg-white shadow-sm border border-[#18366B]/5">
        <div className="h-40 w-40 rounded-full bg-[#18366B]/5 animate-pulse" />
      </div>

      {/* QRコードの進捗（スタンプラリー）部分の骨組み */}
      <div className="mb-8 flex w-full justify-between rounded-3xl bg-white p-5 shadow-sm border border-[#18366B]/5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-[#18366B]/10 animate-pulse" />
        ))}
      </div>

      {/* アクションボタン群の骨組み */}
      <div className="flex w-full flex-col gap-3">
        <div className="h-14 w-full rounded-2xl bg-[#18366B]/10 animate-pulse" />
        <div className="h-12 w-full rounded-2xl bg-[#18366B]/5 animate-pulse" />
      </div>
    </div>
  );
}