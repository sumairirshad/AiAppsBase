import { NextResponse } from "next/server";
import { backendFetch, BackendRequestError } from "@/lib/backend-client";

export async function GET() {
  try {
    const result = await backendFetch<{ authorizationUrl: string; state: string }>("/api/auth/connect");
    return NextResponse.json(result);
  } catch (error) {
    const status = error instanceof BackendRequestError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Unable to start the connection flow.";
    return NextResponse.json({ message }, { status });
  }
}
