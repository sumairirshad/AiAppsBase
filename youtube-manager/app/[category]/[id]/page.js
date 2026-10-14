import { notFound } from "next/navigation";
import { getCategory, STATUS_OPTIONS } from "@/lib/categories";
import { getEntry } from "@/lib/dataService";
import { editEntry } from "../actions";

export default async function EditEntryPage({ params }) {
  const { category: slug, id } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  const entry = getEntry(slug, id);
  if (!entry) notFound();

  const updateAction = editEntry.bind(null, slug, id);

  return (
    <div>
      <a href={`/${slug}`} className="back-link">
        ← {category.label}
      </a>
      <h1>Edit entry</h1>

      <div className="panel">
        <form action={updateAction}>
          <label>
            Title
            <input type="text" name="title" defaultValue={entry.title} required />
          </label>
          <label>
            Status
            <select name="status" defaultValue={entry.status}>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label>
            Date
            <input type="date" name="date" defaultValue={entry.date} />
          </label>
          <label>
            Notes
            <textarea name="notes" defaultValue={entry.notes} />
          </label>
          <button type="submit">Save changes</button>
        </form>
      </div>
    </div>
  );
}
