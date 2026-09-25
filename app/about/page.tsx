"use client";

import { useState } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    BookOpen,
    ChevronRight,
    Egg,
} from "lucide-react";
import { Header } from "@/components/header";
import { TutorialModal } from "@/components/tutorial_modal";
import Image from "next/image";
import labLogo from "@/public/labLog.png";

export default function AboutPage() {
    const [showTutorial, setShowTutorial] = useState(false);

    return (
        <>
            <Header />

            <main className="min-h-dvh bg-[#FFFCF3] px-5 pt-28 pb-[calc(2rem+env(safe-area-inset-bottom))] text-[#18366B]">
                <div className="mx-auto w-full max-w-md">
                    {/* ホームへ戻る */}
                    <Link
                        href="/"
                        className="mb-5 inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-bold focus-visible:outline-2 focus-visible:outline-[#18366B]"
                    >
                        <ArrowLeft aria-hidden="true" className="h-4 w-4" />
                        ホームへ
                    </Link>

                    {/* ページタイトル */}
                    <div className="mb-7 text-center">
                        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#FFF0C2]">
                            <Egg
                                aria-hidden="true"
                                className="h-10 w-10 text-[#A96500]"
                                strokeWidth={1.8}
                            />
                        </div>

                        <h1 className="text-2xl font-extrabold">
                            このアプリについて
                        </h1>

                        <p className="mt-2 text-sm font-bold text-[#65748B]">
                            KSU EGG
                        </p>
                    </div>

                    <div className="flex flex-col gap-4">
                        {/* アプリの紹介 */}
                        <section
                            aria-labelledby="about-introduction"
                            className="rounded-3xl border border-[#18366B]/10 bg-white p-5"
                        >
                            <h2
                                id="about-introduction"
                                className="text-lg font-extrabold"
                            >
                                自分だけのたまごを育てよう
                            </h2>

                            <p className="mt-3 text-sm leading-7">
                                会場のQRコードを探して、質問に答えると、
                                たまごの姿が変わっていきます。
                                どんな子が生まれるか、楽しみにしていてね。
                            </p>
                        </section>

                        {/* チュートリアルをもう一度表示 */}
                        <button
                            type="button"
                            aria-haspopup="dialog"
                            onClick={() => setShowTutorial(true)}
                            className="flex min-h-20 w-full items-center gap-3 rounded-3xl bg-[#FFF0C2] p-5 text-left transition-colors hover:bg-[#FFE7A3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#18366B]"
                        >
                            <BookOpen
                                aria-hidden="true"
                                className="h-6 w-6 shrink-0"
                            />

                            <span className="flex-1">
                                <span className="block text-base font-extrabold">
                                    あそびかた
                                </span>
                                <span className="mt-1 block text-xs">
                                    3つのステップでもう一度確認
                                </span>
                            </span>

                            <ChevronRight
                                aria-hidden="true"
                                className="h-5 w-5 shrink-0"
                            />
                        </button>

                        {/* 同意状態に関係なく読める案内 */}
                        <section aria-labelledby="about-information" className="rounded-3xl border border-[#18366B]/10 bg-white p-5">
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

                        <section aria-labelledby="about-information" className="rounded-3xl border border-[#18366B]/10 bg-white p-5">
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

                        {/* 制作者と問い合わせ先 */}
                        <section
                            aria-labelledby="about-contact"
                            className="rounded-3xl border border-[#18366B]/10 bg-white p-5"
                        >
                            <h2
                                id="about-contact"
                                className="text-lg font-extrabold"
                            >
                                制作・お問い合わせ
                            </h2>



                            <dl className="mt-3 space-y-4 text-sm">
                                <div>
                                    <dt className="font-bold text-[#65748B]">
                                        制作
                                    </dt>
                                    <dd className="mt-1 leading-relaxed">
                                        京都産業大学 情報理工学部 情報理工学科 棟方研究室
                                    </dd>
                                </div>

                                <div>
                                    <dt className="font-bold text-[#65748B]">
                                        お問い合わせ
                                    </dt>
                                    <dd className="mt-1 leading-relaxed">
                                        munekata.lab@gmail.com<br />
                                        （担当者：岡本）
                                    </dd>
                                </div>
                                {/* 研究室のロゴ */}
                                <div className="my-5 flex justify-center">
                <Image
                  src={labLogo}
                  alt="研究室のロゴ"
                  unoptimized
                  sizes="(max-width: 320px) 70vw, 240px"
                  className="h-auto w-full max-w-[150px] object-contain"
                />
                                </div>
                            </dl>
                        </section>
                        {/* ホームへ戻る */}
                        <Link
                            href="/"
                            className="mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#FFBC39] px-4 py-3 font-extrabold text-[#18366B] transition-colors hover:bg-[#FFB020] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#18366B]"
                        >
                            <ArrowLeft aria-hidden="true" className="h-5 w-5" />
                            ホームへ戻る
                        </Link>
                    </div>
                </div>
            </main>

            {/* ホームの初回表示記録は変更しない */}
            {showTutorial && (
                <TutorialModal 
                    fromAbout={true} 
                    onClose={() => setShowTutorial(false)} 
                />
            )}
        </>
    );
}
