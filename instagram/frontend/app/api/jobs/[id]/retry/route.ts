import { NextRequest, NextResponse } from "next/server";
import { backendFetch, BackendRequestError } from "@/lib/backend-client";
import { PublishingJobDto } from "@/lib/types";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const job = await backendFetch<PublishingJobDto>(`/api/publishing/jobs/${id}/retry`, {
      method: "POST"
    });
    return NextResponse.json(job);
  } catch (error) {
    const status = error instanceof BackendRequestError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Unable to retry the publishing job.";
    return NextResponse.json({ message }, { status });
  }
}
