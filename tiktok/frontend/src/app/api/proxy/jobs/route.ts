import { NextResponse } from "next/server";
import { callBackend, BackendRequestError } from "@/lib/server-api";
import type { CreateJobPayload, PublishingJob } from "@/lib/types";

export async function GET() {
  try {
    const jobs = await callBackend<PublishingJob[]>("/api/publishing/jobs");
    return NextResponse.json(jobs);
  } catch (error) {
    if (error instanceof BackendRequestError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Unable to reach the TikTok backend." }, { status: 502 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as CreateJobPayload;
    const job = await callBackend<PublishingJob>("/api/publishing/jobs", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    if (error instanceof BackendRequestError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }
    return NextResponse.json({ message: "Unable to reach the TikTok backend." }, { status: 502 });
  }
}
