import "./globals.css";
import { M_PLUS_Rounded_1c } from "next/font/google";

const rounded = M_PLUS_Rounded_1c({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-rounded",
  display: "swap",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={rounded.variable}>{children}</body>
    </html>
  );
}