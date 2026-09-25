"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthHeader } from "@/components/auth-header";
import { EntryGuard } from "@/components/entry-guard";

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
            // DB通信（acceptConsent）はやめ、ブラウザのメモリに記録するだけ
            sessionStorage.setItem("terms_agreed", "true");
            
            // 登録画面へ移動（パラメータを引き継ぐ）
            const search = window.location.search;
            router.replace(`/register${search}`);
        } catch (error) {
            console.error("遷移に失敗しました:", error);
            setConsentError("エラーが発生しました。もう一度お試しください。");
            setIsSaving(false);
        }
    };

    return (
        <>
            <AuthHeader />

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
                        <div className="mt-2 text-sm leading-7">
                            <p className="font-bold mt-4">1．研究計画の概要に関する事項</p>
                            <p className="mb-5">
                                本実験は、Webアプリケーションを用いた学内イベントを通じて、普段とは異なる行動目的を持つ人々（目的地へ一直線に向かう「目的遂行型」に対し、空間を回遊する「探索型」）が増加した際に、全体の人流にどのような特徴が現れるのかを調査することを目的としています。参加者の方には実際にWebアプリケーションに登録していただき、ご自身のペースでイベントに参加（学内の回遊など）していただきます。イベント中の移動ルートや参加・不参加は自由です。実験後は簡単なアンケートへの回答にご協力をお願いします。実験では、アプリケーションを通じた行動履歴（イベントの参加状況や移動の軌跡など）とアンケートの回答内容を実験データとして収集します。
                            </p>

                            <p className="font-bold">2．個人情報保護の方法に関する事項</p>
                            <p className="mb-5">
                                本実験は個人の能力や特定の行動を評価するものではなく、人々の行動原理の違いによって生じる人流の特徴を、取得したデータから客観的に読み取ることができるかを検証することを目的としています。収集した実験データは全て匿名化および統計処理を行い、個人が特定できない形で厳重に管理・分析します。実験データを学術論文や研究発表などで使用する場合においても、個人が特定できない形式でのみ使用します。
                            </p>

                            <p className="font-bold">3．安全管理に関する事項</p>
                            <p className="mb-5">
                                イベントへの参加・不参加は自由ですので、体調不良などを感じた場合は個人の判断でいつでも実験を中止してください。また、移動中のスマートフォン操作（歩きスマホ）は大変危険ですので、アプリケーションを操作する際は必ず安全な場所で立ち止まって行ってください。
                            </p>

                            <p className="font-bold">4．インフォームド・コンセントに関する事項</p>
                            <ul className="mb-5">
                                <li className="before:content-['・'] ml-4 -indent-3.5">
                                    本実験への参加は任意であり、強制するものではありません。また、実験中に中断を求める場合はいつでも申し出ることができます。
                                </li>
                                <li className="before:content-['・'] ml-4 -indent-3.5">
                                    実験後、実験への同意を撤回する場合はいつでも申し出てください。得られた実験データ等を破棄します。また、このことにより不利益をこうむることはありません。
                                </li>
                                <li className="before:content-['・'] ml-4 -indent-3.5">
                                    実験データの開示を請求された場合は開示します。
                                </li>
                                <li className="before:content-['・'] ml-4 -indent-3.5">
                                    得られた実験データおよびアンケート結果は、本研究のためのみに使用し、第三者に譲渡しません。
                                </li>
                                <li className="before:content-['・'] ml-4 -indent-3.5">
                                    本実験に関する研究成果は学会発表や論文発表等に使用する可能性があります。
                                </li>
                            </ul>
                        </div>
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
                            京都産業大学 情報理工学部 情報理工学科 棟方研究室<br />
                            munekata.lab@gmail.com<br />
                            （担当者：岡本）
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