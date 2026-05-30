// matmatch_admin/src/app/Provider.tsx
"use client"; // 클라이언트 컴포넌트임을 명시

import { SessionProvider } from "next-auth/react";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
