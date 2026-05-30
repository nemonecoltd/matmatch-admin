import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

const BACKEND = process.env.BACKEND_URL || "http://34.64.98.113:8080";
const SECRET = process.env.ADMIN_SECRET_KEY || "";

export async function adminProxy(request: Request, backendPath: string): Promise<Response> {
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ detail: "Unauthorized" }, { status: 401 });
  }

  const isWrite = !["GET", "HEAD"].includes(request.method);
  const contentType = request.headers.get("content-type") ?? "";

  const headers: Record<string, string> = {
    "x-admin-secret": SECRET,
  };
  if (contentType) headers["content-type"] = contentType;

  const body = isWrite ? await request.arrayBuffer() : undefined;

  const res = await fetch(`${BACKEND}${backendPath}`, {
    method: request.method,
    headers,
    body: body ? Buffer.from(body) : undefined,
  });

  const resBody = await res.arrayBuffer();
  return new Response(resBody, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") ?? "application/json",
    },
  });
}
