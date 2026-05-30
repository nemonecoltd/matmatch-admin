// matmatch_admin/src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // 환경 변수에 설정된 ADMIN_EMAIL과 로그인 시도하는 user.email을 비교
                console.log("Comparing Admin Email:", process.env.ADMIN_EMAIL);
                console.log("Comparing User Email:", user.email);
      
                if (user.email === process.env.ADMIN_EMAIL) {
                  return true; // 일치하면 로그인 허용
                }
                // 일치하지 않으면 로그인 거부
                return false;
              },
            },
            // 세션 암호화 등에 사용되는 비밀 키 (2단계에서 설정한 NEXTAUTH_SECRET)
            secret: process.env.NEXTAUTH_SECRET,
            debug: true // 개발 시 디버그 정보 확인 (운영 환경에서는 비활성화 권장)
          });
export { handler as GET, handler as POST };
