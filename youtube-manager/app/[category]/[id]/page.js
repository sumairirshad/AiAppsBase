import { notFound } from "next/navigation";
import { getCategory } from "@/lib/categories";
import { getEntry } from "@/lib/dataService";
import { EditEntryForm } from "./edit-entry-form";

export default async function EditEntryPage({ params }) {
  const { category: slug, id } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  const entry = getEntry(slug, id);
  if (!entry) notFound();

  return <EditEntryForm category={slug} categoryLabel={category.label} entry={entry} />;
}
