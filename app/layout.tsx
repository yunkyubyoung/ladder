import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "사다리게임 | 오늘의 작은 내기",
  description: "이름과 결과를 적고 재미있게 즐기는 손그림 사다리게임",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
