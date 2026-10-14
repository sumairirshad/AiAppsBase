import { NextResponse } from "next/server";
import { getCategory } from "@/lib/categories";
import { entrySchema } from "@/lib/validation";
import { updateEntry } from "@/lib/dataService";
import { ConfigError } from "@/lib/env";

export async function PATCH(request, { params }) {
  const { category, id } = await params;
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

  try {
    const entry = await updateEntry(category, id, parsed.data);
    if (!entry) {
      return NextResponse.json({ ok: false, error: "Entry not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, entry });
  } catch (err) {
    const message = err instanceof ConfigError ? err.errors.join(" ") : err.message || "Something went wrong.";
    return NextResponse.json({ ok: false, error: message }, { status: err instanceof ConfigError ? 412 : 502 });
  }
}
