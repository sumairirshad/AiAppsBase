import { NextResponse } from "next/server";
import { callBackend, BackendRequestError } from "@/lib/server-api";
import type { ConnectedAccount } from "@/lib/types";

export async function GET() {
  try {
    const accounts = await callBackend<ConnectedAccount[]>("/api/accounts");
    return NextResponse.json(accounts);
  } catch (error) {
    if (error instanceof BackendRequestError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Unable to reach the TikTok backend." }, { status: 502 });
  }
}
