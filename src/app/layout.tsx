import type { Metadata } from "next";
import Providers from "./Provider"; // 위에서 만든 Provider 임포트

export const metadata: Metadata = {
  metadataBase: new URL('https://admin.nemoneai.com'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#0c0c0c' }}>
        {/* 글로벌 CSS 임포트 완전 제거: 외부 스타일 간섭을 원천 차단합니다. */}
        <Providers>{children}</Providers> {/* children을 Providers로 감쌈 */}
      </body>
    </html>
  );
}