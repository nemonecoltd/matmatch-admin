import { adminProxy } from "@/lib/adminProxy";

export async function GET(request: Request) {
  return adminProxy(request, "/posts" + new URL(request.url).search);
}

export async function POST(request: Request) {
  return adminProxy(request, "/posts");
}
