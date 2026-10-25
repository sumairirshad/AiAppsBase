import { NextResponse } from "next/server";
import { backendFetch, BackendRequestError } from "@/lib/backend-client";
import { AccountDto } from "@/lib/types";

export async function GET() {
  try {
    const accounts = await backendFetch<AccountDto[]>("/api/accounts");
    return NextResponse.json(accounts);
  } catch (error) {
    const status = error instanceof BackendRequestError ? error.status : 500;
    const message = error instanceof Error ? error.message : "Unable to load accounts.";
    return NextResponse.json({ message }, { status });
  }
}
