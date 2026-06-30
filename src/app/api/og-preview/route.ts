import { adminProxy } from "@/lib/adminProxy";

export async function GET(request: Request) {
  return adminProxy(request, "/og-preview" + new URL(request.url).search);
}
