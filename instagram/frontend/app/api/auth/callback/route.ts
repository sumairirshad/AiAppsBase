import { NextRequest, NextResponse } from "next/server";
import { backendFetch, BackendRequestError } from "@/lib/backend-client";
import { AccountDto } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const account = await backendFetch<AccountDto>("/api/auth/callback", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    return NextResponse.json(account);
  } catch (error) {
    const status = error instanceof BackendRequestError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Unable to complete the connection.";
    return NextResponse.json({ message }, { status });
  }
}
