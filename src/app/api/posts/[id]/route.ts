import { adminProxy } from "@/lib/adminProxy";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  return adminProxy(request, `/posts/${params.id}`);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  return adminProxy(request, `/posts/${params.id}`);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  return adminProxy(request, `/posts/${params.id}`);
}
