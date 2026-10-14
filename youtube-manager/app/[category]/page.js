import { notFound } from "next/navigation";
import { getCategory, STATUS_OPTIONS } from "@/lib/categories";
import { getEntries } from "@/lib/dataService";
import { createEntry } from "./actions";

export default async function CategoryPage({ params }) {
  const { category: slug } = await params;
  const category = getCategory(slug);
  if (!category) notFound();

  const entries = getEntries(slug);
  const addAction = createEntry.bind(null, slug);

  return (
    <div>
      <a href="/" className="back-link">
        ← All categories
      </a>
      <h1>{category.label}</h1>

      <div className="entry-list">
        {entries.length === 0 && (
          <p className="empty-state">No entries yet. Add one below.</p>
        )}
        {entries.map((entry) => (
          <div key={entry.id} className="entry-row">
            <div className="entry-row-main">
              <span className="entry-title">{entry.title}</span>
              <span className="entry-meta">
                {entry.date} {entry.notes ? `· ${entry.notes}` : ""}
              </span>
            </div>
            <div>
              <span className="status-badge">{entry.status}</span>
              <a className="edit-link" href={`/${slug}/${entry.id}`}>
                Edit
              </a>
            </div>
          </div>
        ))}
      </div>

      <div className="panel">
        <h2>Add new entry</h2>
        <form action={addAction}>
          <label>
            Title
            <input type="text" name="title" required />
          </label>
          <label>
            Status
            <select name="status" defaultValue={STATUS_OPTIONS[0]}>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label>
            Date
            <input type="date" name="date" />
          </label>
          <label>
            Notes
            <textarea name="notes" />
          </label>
          <button type="submit">Add entry</button>
        </form>
      </div>
    </div>
  );
}
