import { NextRequest, NextResponse } from "next/server";
import { backendFetch, BackendRequestError } from "@/lib/backend-client";
import { MetricDto } from "@/lib/types";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const metrics = await backendFetch<MetricDto[]>(`/api/insights/accounts/${id}/sync`, {
      method: "POST"
    });
    return NextResponse.json(metrics);
  } catch (error) {
    const status = error instanceof BackendRequestError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Unable to sync insights.";
    return NextResponse.json({ message }, { status });
  }
}
