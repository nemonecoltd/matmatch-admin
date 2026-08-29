import { adminProxy } from "@/lib/adminProxy";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  return adminProxy(request, `/admin/affiliate-products/${params.id}`);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  return adminProxy(request, `/admin/affiliate-products/${params.id}`);
}
