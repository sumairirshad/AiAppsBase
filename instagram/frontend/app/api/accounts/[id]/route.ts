import { NextRequest, NextResponse } from "next/server";
import { backendFetch, BackendRequestError } from "@/lib/backend-client";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await backendFetch<void>(`/api/accounts/${id}`, { method: "DELETE" });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const status = error instanceof BackendRequestError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Unable to disconnect the account.";
    return NextResponse.json({ message }, { status });
  }
}
