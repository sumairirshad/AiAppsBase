import { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-[var(--ig-border)] bg-[var(--ig-surface)] p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" }) {
  const base = "rounded-md px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50";
  const variants: Record<string, string> = {
    primary: "bg-[var(--ig-accent)] text-white hover:opacity-90",
    secondary: "border border-[var(--ig-border)] text-[var(--ig-text)] hover:bg-gray-50",
    danger: "bg-red-600 text-white hover:bg-red-700"
  };
  return (
    <button className={`${base} ${variants[variant]}`} disabled={disabled} {...props}>
      {children}
    </button>
  );
}

export function Badge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Published: "bg-green-100 text-green-800",
    Pending: "bg-yellow-100 text-yellow-800",
    Processing: "bg-blue-100 text-blue-800",
    Failed: "bg-red-100 text-red-800",
    Draft: "bg-gray-100 text-gray-700"
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status] ?? "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  );
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-dashed border-[var(--ig-border)] p-10 text-center">
      <p className="font-medium text-[var(--ig-text)]">{title}</p>
      <p className="mt-1 text-sm text-[var(--ig-muted)]">{description}</p>
    </div>
  );
}

export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return <p className="text-sm text-[var(--ig-muted)]">{label}</p>;
}

export function ErrorAlert({ message }: { message: string }) {
  return (
    <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{message}</div>
  );
}
