import type { Metadata } from "next";
import Providers from "./Provider"; // 위에서 만든 Provider 임포트

export const metadata: Metadata = {
  metadataBase: new URL('https://admin.nemoneai.com'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        {/* MD 첨부 표 등 스타일 — globals.css @layer components 안에 두면 원인 불명의
            Next.js 14.2.3+Tailwind v4 빌드 버그로 프로덕션 빌드에서만 통째로 사라져서
            (npm run dev는 정상, standalone tailwindcss CLI 직접 컴파일도 정상 — Next.js
            빌드 파이프라인 어딘가에서 소실됨. 원인 특정 실패, 2026-08-09) public/ 정적
            파일로 분리해 완전히 우회함. */}
        <link rel="stylesheet" href="/md-import-block.css" />
      </head>
      <body style={{ margin: 0, padding: 0, backgroundColor: '#0c0c0c' }}>
        {/* 글로벌 CSS 임포트 완전 제거: 외부 스타일 간섭을 원천 차단합니다. */}
        <Providers>{children}</Providers> {/* children을 Providers로 감쌈 */}
      </body>
    </html>
  );
}