"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { EntryGuard } from "@/components/entry-guard";
import { acceptConsent } from "@/lib/consent";

function ConsentContent() {
    const router = useRouter();
    const [agreed, setAgreed] = useState(false);

    // 同意記録の保存状態
    const [isSaving, setIsSaving] = useState(false);
    const [consentError, setConsentError] = useState("");

    // 保存が完了してから次の画面へ進む
    const handleAccept = async () => {
        if (!agreed || isSaving) return;

        setIsSaving(true);
        setConsentError("");

        try {
            await acceptConsent();
            router.replace("/register");
        } catch (error) {
            console.error("同意記録の保存に失敗しました:", error);
            setConsentError(
                "保存できませんでした。通信状況を確認して、もう一度お試しください。"
            );
            setIsSaving(false);
        }
    };

    return (
        <>
            <Header />

            <main className="min-h-dvh bg-[#FFFCF3] px-5 pt-28 pb-[calc(8rem+env(safe-area-inset-bottom))] text-[#18366B]">        <div className="mx-auto w-full max-w-md">
                {/* ページタイトル */}
                <div className="mb-6 text-center">
                    <h1 className="text-3xl font-extrabold">
                        はじめる前に
                    </h1>
                    <p className="mt-3 text-sm leading-relaxed">
                        保護者の方といっしょに
                        <br />
                        内容を確認してください。
                    </p>
                </div>

                {/* 公開前に正式な案内文へ差し替える */}
                <div className="space-y-6 rounded-3xl border border-[#18366B]/10 bg-white/80 p-6">
                    <section aria-labelledby="consent-data">
                        <h2
                            id="consent-data"
                            className="text-base font-extrabold"
                        >
                            情報の取り扱いについて
                        </h2>
                        <p className="mt-2 text-sm leading-7">
                            ［取得する情報、利用目的、保存期間、削除の方法を記載してください。］
                        </p>
                    </section>

                    <section aria-labelledby="consent-camera">
                        <h2
                            id="consent-camera"
                            className="text-base font-extrabold"
                        >
                            カメラの利用について
                        </h2>
                        <p className="mt-2 text-sm leading-7">
                            QRコードの読み取りにカメラを使います。
                            カメラが使えないときは、スタッフに声をかけてください。
                        </p>
                    </section>

                    <section aria-labelledby="consent-safety">
                        <h2
                            id="consent-safety"
                            className="text-base font-extrabold"
                        >
                            あそぶときのおねがい
                        </h2>
                        <p className="mt-2 text-sm leading-7">
                            スマートフォンを見るときは、立ち止まってね。
                            まわりに気をつけて、楽しくあそぼう！
                        </p>
                    </section>

                    <section aria-labelledby="consent-contact">
                        <h2
                            id="consent-contact"
                            className="text-base font-extrabold"
                        >
                            お問い合わせ
                        </h2>
                        <p className="mt-2 text-sm leading-7">
                            ［運営者名と問い合わせ先を記載してください。］
                        </p>
                    </section>
                </div>
            </div>
            </main>
            {/* コンパクトな同意操作バー */}
            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#18366B]/10 bg-[#FFFCF3] px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
                <div className="mx-auto flex w-full max-w-md flex-wrap items-center justify-between gap-x-3 gap-y-2">
                    {/* 同意の確認 */}
                    <label
                        htmlFor="consent-agree"
                        className="flex min-h-11 cursor-pointer items-center gap-2.5"
                    >
                        <input
                            id="consent-agree"
                            type="checkbox"
                            checked={agreed}
                            onChange={(event) => setAgreed(event.target.checked)}
                            className="h-5 w-5 shrink-0 accent-[#18366B] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#18366B]"
                        />

                        <span className="text-xs leading-5 font-bold text-[#18366B]">
                            内容を確認し、
                            <br />
                            同意します
                        </span>
                    </label>

                    {/* 登録画面へ進む */}
                    <button
                        type="button"
                        disabled={!agreed || isSaving}
                        onClick={handleAccept}
                        className="min-h-11 rounded-full bg-[#FFBC39] px-6 py-2.5 text-sm font-extrabold text-[#18366B] transition-colors enabled:hover:bg-[#FFB020] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#18366B] disabled:cursor-not-allowed disabled:bg-[#E5E7EB] disabled:text-[#65748B]"
                    >
                        {isSaving ? "保存中..." : "つづける"}
                        {/* 保存エラーを表示 */}
                        {consentError && (
                            <p role="alert" className="mb-2 text-sm text-[#B42332]">
                                {consentError}
                            </p>
                        )}
                        <span aria-hidden="true" className="ml-2">→</span>
                    </button>
                </div>
            </div>
        </>
    );
}

// 同意済み・登録済みの場合は表示前に移動
export default function ConsentPage() {
    return (
        <EntryGuard page="consent">
            <ConsentContent />
        </EntryGuard>
    );
}