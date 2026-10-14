import { NextResponse } from "next/server";
import { getCategory, UPLOAD_CATEGORIES } from "@/lib/categories";
import { entrySchema, MAX_VIDEO_FILE_BYTES } from "@/lib/validation";
import { addEntry } from "@/lib/dataService";
import { ConfigError } from "@/lib/env";

export async function POST(request, { params }) {
  const { category } = await params;
  const meta = getCategory(category);
  if (!meta) {
    return NextResponse.json({ ok: false, error: "Unknown category." }, { status: 404 });
  }

  const formData = await request.formData();
  const parsed = entrySchema.safeParse({
    title: formData.get("title"),
    status: formData.get("status"),
    date: formData.get("date") || "",
    notes: formData.get("notes") || "",
  });

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues.map((issue) => issue.message).join(" ") },
      { status: 400 }
    );
  }

  const isMock = process.env.USE_MOCK_DATA === "true";
  const file = formData.get("video");
  const hasFile = Boolean(file && typeof file === "object" && file.size > 0);

  if (hasFile && file.size > MAX_VIDEO_FILE_BYTES) {
    return NextResponse.json(
      { ok: false, error: "Video file is too large (500MB max for this MVP)." },
      { status: 400 }
    );
  }

  if (UPLOAD_CATEGORIES.has(category) && !isMock && !hasFile) {
    return NextResponse.json(
      { ok: false, error: "A video file is required to upload to YouTube in real mode." },
      { status: 400 }
    );
  }

  try {
    const entry = await addEntry(category, parsed.data, hasFile ? file : null);
    return NextResponse.json({ ok: true, entry });
  } catch (err) {
    const message = err instanceof ConfigError ? err.errors.join(" ") : err.message || "Something went wrong.";
    return NextResponse.json({ ok: false, error: message }, { status: err instanceof ConfigError ? 412 : 502 });
  }
}
