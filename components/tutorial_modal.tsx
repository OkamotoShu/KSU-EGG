// components/tutorial_modal.tsx

interface TutorialModalProps {
  onClose: () => void;
}

export function TutorialModal({ onClose }: TutorialModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-300">
        <h2 className="mb-4 text-center text-xl font-bold text-gray-800">
          あそびかた
        </h2>
        
        <div className="mb-6 flex flex-col gap-4 text-gray-700">
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">1</span>
            <p className="text-sm text-left">会場内に隠された<span className="font-bold text-blue-600">QRコード</span>を探そう！</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">2</span>
            <p className="text-sm text-left">カメラで読み取って、たまごを成長させよう！</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">3</span>
            <p className="text-sm text-left">全てのQRを見つけると、たまごが<span className="font-bold text-red-500">孵化</span>するよ！</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white shadow-md transition hover:bg-blue-700 active:scale-95"
        >
          はじめる！
        </button>
      </div>
    </div>
  );
}