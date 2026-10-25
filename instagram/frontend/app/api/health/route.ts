import { NextResponse } from "next/server";
import { backendFetchAnonymous, BackendRequestError } from "@/lib/backend-client";

export async function GET() {
  try {
    const health = await backendFetchAnonymous<{ status: string; service: string; timestampUtc: string }>("/health");
    return NextResponse.json(health);
  } catch (error) {
    const status = error instanceof BackendRequestError ? error.status : 503;
    const message = error instanceof Error ? error.message : "Backend is unreachable.";
    return NextResponse.json({ message }, { status });
  }
}
