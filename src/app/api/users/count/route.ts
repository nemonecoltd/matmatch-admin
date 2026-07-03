import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Supabase env 미설정" }, { status: 500 });
  }

  let allUsers: any[] = [];
  let page = 1;

  while (true) {
    const res = await fetch(
      `${SUPABASE_URL}/auth/v1/admin/users?page=${page}&per_page=1000`,
      {
        headers: {
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          apikey: SERVICE_ROLE_KEY,
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Supabase API 오류" }, { status: 500 });
    }

    const data = await res.json();
    const users: any[] = data.users ?? [];
    allUsers = allUsers.concat(users);

    if (users.length < 1000) break;
    page++;
  }

  const google = allUsers.filter((u) => u.app_metadata?.provider === "google").length;
  const email = allUsers.filter((u) => u.app_metadata?.provider === "email").length;
  const kakao = allUsers.filter((u) => u.app_metadata?.provider === "kakao").length;

  return NextResponse.json({ total: allUsers.length, google, email, kakao });
}
