// components/egg_display.tsx
import Image from "next/image";

interface EggDisplayProps {
  // 必要に応じて stage や status などの props を拡張可能
  imageSrc?: string;
  altText?: string;
}

export function EggDisplay({
  imageSrc = "/egg0.png",
  altText = "Egg",
}: EggDisplayProps) {
  return (
    <div className="relative flex items-center justify-center p-4">
      <Image
        src={imageSrc}
        alt={altText}
        width={300}
        height={300}
        priority
        className="object-contain select-none"
      />
    </div>
  );
}