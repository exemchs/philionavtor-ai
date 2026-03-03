import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EXEM AI - 일하는 방식이 바뀌고 있습니다",
  description:
    "2026년, AI는 선택이 아닌 기본 인프라가 되었습니다. EXEM이 그 변화의 중심에 서야 할 이유.",
  openGraph: {
    title: "EXEM AI - 일하는 방식이 바뀌고 있습니다",
    description:
      "2026년, AI는 선택이 아닌 기본 인프라가 되었습니다. EXEM이 그 변화의 중심에 서야 할 이유.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" data-theme="dark" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
