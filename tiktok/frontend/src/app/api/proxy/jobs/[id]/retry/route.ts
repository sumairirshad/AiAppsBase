import { NextResponse } from "next/server";
import { callBackend, BackendRequestError } from "@/lib/server-api";
import type { PublishingJob } from "@/lib/types";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const job = await callBackend<PublishingJob>(`/api/publishing/jobs/${id}/retry`, { method: "POST" });
    return NextResponse.json(job);
  } catch (error) {
    if (error instanceof BackendRequestError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Unable to reach the TikTok backend." }, { status: 502 });
  }
}
