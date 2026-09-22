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
                        <section
                            aria-labelledby="about-information"
                            className="rounded-3xl border border-[#18366B]/10 bg-white p-5"
                        >
                            <h2
                                id="about-information"
                                className="text-lg font-extrabold"
                            >
                                情報の取り扱い
                            </h2>

                            <p className="mt-3 text-sm leading-7">
                                ［取得する情報、利用目的、保存期間、
                                削除の方法を記載してください。］
                            </p>

                            <h3 className="mt-5 text-sm font-extrabold">
                                カメラについて
                            </h3>

                            <p className="mt-2 text-sm leading-7">
                                QRコードを読み取るためにお手元のスマホのカメラ機能を使います。
                                カメラが使えないときは、
                                近くのスタッフに声をかけてください。
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
                                        ［制作チーム名］
                                    </dd>
                                </div>

                                <div>
                                    <dt className="font-bold text-[#65748B]">
                                        お問い合わせ
                                    </dt>
                                    <dd className="mt-1 leading-relaxed">
                                        ［問い合わせ先］
                                    </dd>
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
                <TutorialModal onClose={() => setShowTutorial(false)} />
            )}
        </>
    );
}