import { NextRequest, NextResponse } from "next/server";
import { backendFetch, BackendRequestError } from "@/lib/backend-client";
import { PublishingJobDto } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.search;
    const jobs = await backendFetch<PublishingJobDto[]>(`/api/publishing/jobs${search}`);
    return NextResponse.json(jobs);
  } catch (error) {
    const status = error instanceof BackendRequestError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Unable to load publishing jobs.";
    return NextResponse.json({ message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const job = await backendFetch<PublishingJobDto>("/api/publishing/jobs", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    const status = error instanceof BackendRequestError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Unable to create the publishing job.";
    return NextResponse.json({ message }, { status });
  }
}
