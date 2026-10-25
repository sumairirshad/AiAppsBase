import { NextResponse } from "next/server";
import { callBackend, BackendRequestError } from "@/lib/server-api";
import type { VideoStat } from "@/lib/types";

export async function GET(_request: Request, { params }: { params: Promise<{ accountId: string }> }) {
  try {
    const { accountId } = await params;
    const stats = await callBackend<VideoStat[]>(`/api/stats/accounts/${accountId}/videos`);
    return NextResponse.json(stats);
  } catch (error) {
    if (error instanceof BackendRequestError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Unable to reach the TikTok backend." }, { status: 502 });
  }
}
