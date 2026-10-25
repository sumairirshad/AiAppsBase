import { NextResponse } from "next/server";
import { callBackend, BackendRequestError } from "@/lib/server-api";

export async function GET() {
  try {
    const result = await callBackend<{ authorizationUrl: string }>("/api/accounts/connect");
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof BackendRequestError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Unable to reach the TikTok backend." }, { status: 502 });
  }
}
