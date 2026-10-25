import { NextRequest, NextResponse } from "next/server";
import { backendFetch, BackendRequestError } from "@/lib/backend-client";
import { MetricDto } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ mediaId: string }> }
) {
  try {
    const { mediaId } = await params;
    const accountId = request.nextUrl.searchParams.get("accountId");
    const metrics = await backendFetch<MetricDto[]>(
      `/api/insights/media/${mediaId}?accountId=${accountId}`
    );
    return NextResponse.json(metrics);
  } catch (error) {
    const status = error instanceof BackendRequestError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Unable to load media insights.";
    return NextResponse.json({ message }, { status });
  }
}
