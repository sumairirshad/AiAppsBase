import { CATEGORIES } from "@/lib/categories";

export default function HomePage() {
  return (
    <div>
      <h1>Content Planner</h1>
      <p className="subtitle">Pick a category to view or plan entries.</p>
      <div className="category-grid">
        {CATEGORIES.map((category) => (
          <a
            key={category.slug}
            href={`/${category.slug}`}
            className="category-card"
          >
            {category.label}
          </a>
        ))}
      </div>
    </div>
  );
}
