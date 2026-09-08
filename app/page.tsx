// app/page.tsx
import { EggDisplay } from "@/components/egg_display";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function Home() {
  // 今後の切り替え用（例: stateや条件分岐）
  const eggSrc = "/egg0.png";

  return (
    <div className="relative flex min-h-dvh flex-col">
      <Header />

      {/* ヘッダー(pt-14)とフッター(pb-14)の被りを避けつつ中央配置 */}
      <main className="flex flex-1 items-center justify-center pt-14 pb-14">
        <EggDisplay imageSrc={eggSrc} />
      </main>

      <Footer />
    </div>
  );
}