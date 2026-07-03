import { adminProxy } from "@/lib/adminProxy";

export async function GET(request: Request) {
  return adminProxy(request, "/admin/ranking/top10");
}
