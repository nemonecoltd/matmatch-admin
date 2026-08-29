import { adminProxy } from "@/lib/adminProxy";

export async function GET(request: Request) {
  return adminProxy(request, "/admin/affiliate-products");
}

export async function POST(request: Request) {
  return adminProxy(request, "/admin/affiliate-products");
}
