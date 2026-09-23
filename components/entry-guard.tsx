"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDocFromServer } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
// import { hasAcceptedConsent } from "@/lib/consent"; ← 不要になるので削除！

type EntryGuardProps = {
    page: "consent" | "register";
    children: ReactNode;
};

export function EntryGuard({ page, children }: EntryGuardProps) {
    const router = useRouter();
    const [status, setStatus] = useState<
        "checking" | "ready" | "error"
    >("checking");

    useEffect(() => {
        let active = true;
        let requestId = 0;

        const unsubscribe = onAuthStateChanged(
            auth,
            async (user) => {
                const currentRequest = ++requestId;

                try {
                    let isRegistered = false;

                    if (user) {
                        // 通信エラーを未登録として扱わない
                        const snapshot = await getDocFromServer(
                            doc(db, "users", user.uid)
                        );
                        isRegistered = snapshot.exists();
                    }

                    if (!active || currentRequest !== requestId) return;

                    // ▼ 変更点1: DB通信をやめ、ブラウザの一時メモ(sessionStorage)を確認
                    const accepted = sessionStorage.getItem("terms_agreed") === "true";

                    // ▼ 変更点2: QRコードからのリダイレクトパラメータ（?redirect=...）を保持
                    const search = window.location.search;

                    // ▼ 変更点3: シンプルになった判定ロジック
                    if (isRegistered) {
                        // 既に登録完了している人はどちらのページも用済みなのでホームへ
                        router.replace("/");
                        return;
                    }

                    if (page === "consent") {
                        // 同意画面にいるが、すでに同意済みの場合は登録画面へ（パラメータを引き継ぐ）
                        if (accepted) {
                            router.replace(`/register${search}`);
                            return;
                        }
                    } else if (page === "register") {
                        // 登録画面にいるが、未同意の場合は同意画面へ戻す（パラメータを引き継ぐ）
                        if (!accepted) {
                            router.replace(`/consent${search}`);
                            return;
                        }
                    }

                    setStatus("ready");
                } catch (error) {
                    if (!active || currentRequest !== requestId) return;

                    console.error("登録状況の確認に失敗しました:", error);
                    setStatus("error");
                }
            },
            (error) => {
                if (!active) return;

                console.error("認証状態の確認に失敗しました:", error);
                setStatus("error");
            }
        );

        return () => {
            active = false;
            unsubscribe();
        };
    }, [page, router]);

    // 確認前にフォームを表示しない
    if (status !== "ready") {
        return (
            <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#FFFCF3] px-5 text-center text-[#18366B]">
                <p role="status" className="text-sm font-bold">
                    {status === "error"
                        ? "確認できませんでした。通信状況を確認してください。"
                        : "確認しています..."}
                </p>

                {status === "error" && (
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="min-h-12 rounded-2xl bg-[#FFBC39] px-6 py-3 text-sm font-bold"
                    >
                        もう一度ためす
                    </button>
                )}
            </main>
        );
    }

    return <>{children}</>;
}