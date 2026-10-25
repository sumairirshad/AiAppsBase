import { NextResponse } from "next/server";
import { callBackend, BackendRequestError } from "@/lib/server-api";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await callBackend(`/api/accounts/${id}`, { method: "DELETE" });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof BackendRequestError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Unable to reach the TikTok backend." }, { status: 502 });
  }
}
