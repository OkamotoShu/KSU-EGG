import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function Qrreader() {
  // 今後の切り替え用（例: stateや条件分岐）
  const eggSrc = "/egg0.png";

  return (
    <div className="relative flex min-h-dvh flex-col">
      <Header />

    
      <Footer />
    </div>
  );
}