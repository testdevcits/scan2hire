import { Link } from "react-router-dom";

const surface = "rounded-sm border border-[#f4e9e6] bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900";

/** Responsive page title block with optional page-level actions. */
export const PageHeader = ({ title, description, actions, className = "" }) => (
  <header className={`${surface} flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4 ${className}`}>
    <div className="min-w-0">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 sm:text-3xl">{title}</h1>
      {description && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>}
    </div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </header>
);

/** General purpose metric tile for dashboards and report summaries. */
export const MetricCard = ({ label, value, note, index, icon, iconClassName = "", variant = "default", className = "" }) => {
  const featured = variant === "featured";

  return (
    <section className={`flex min-h-[112px] flex-col justify-between rounded-sm border p-3 shadow-sm ${
      featured
        ? "border-transparent bg-gradient-to-br from-[#f84525] via-[#f25d23] to-[#ffa826] text-white"
        : "border-[#f4e9e6] bg-white text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100"
    } ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-sm ${featured ? "text-white/85" : "text-gray-500 dark:text-gray-400"}`}>{label}</p>
          <p className={`mt-1.5 text-2xl font-bold tabular-nums ${featured ? "text-white" : "text-gray-900 dark:text-gray-100"}`}>{value}</p>
        </div>
        {icon ? (
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${featured ? "bg-white/15 text-white" : iconClassName || "bg-orange-50 text-[#f84525] dark:bg-orange-950/50 dark:text-orange-300"}`}>
            {icon}
          </span>
        ) : index !== undefined ? (
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
            featured ? "bg-white/15 text-white" : "bg-orange-50 text-[#f84525] dark:bg-orange-950/50 dark:text-orange-300"
          }`}>{String(index).padStart(2, "0")}</span>
        ) : null}
      </div>
      {note && <p className={`mt-2 text-xs ${featured ? "text-white/80" : "text-gray-500 dark:text-gray-400"}`}>{note}</p>}
    </section>
  );
};

/** Themed wrapper for charts, tables, and other page content. */
export const SectionCard = ({ title, subtitle, action, children, className = "", contentClassName = "", density = "compact" }) => {
  const headerSpacing = density === "comfortable" ? "px-4 py-3 sm:px-5" : "px-3 py-2.5 sm:px-4";
  const bodySpacing = density === "comfortable" ? "p-4 sm:p-5" : "p-3 sm:p-4";

  return (
    <section className={`${surface} min-w-0 overflow-hidden ${className}`}>
      {(title || subtitle || action) && (
        <header className={`flex flex-col gap-2 border-b border-gray-100 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between ${headerSpacing}`}>
          <div className="min-w-0">
            {title && <h2 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h2>}
            {subtitle && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={`${bodySpacing} ${contentClassName}`}>{children}</div>
    </section>
  );
};

/** Accessible navigation card with a single keyboard-focusable link target. */
export const ActionCard = ({ to, title, description, icon, className = "" }) => (
  <Link to={to} className={`${surface} group flex h-full min-h-[180px] min-w-0 flex-col p-3 text-left transition hover:border-orange-200 hover:bg-orange-50/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f84525] dark:hover:border-orange-900 dark:hover:bg-gray-800 ${className}`}>
    <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-orange-50 text-[#f84525] dark:bg-orange-950/50 dark:text-orange-300">{icon}</span>
    <span className="block font-semibold text-gray-900 dark:text-gray-100">{title}</span>
    <span className="mt-2 block text-sm text-gray-500 dark:text-gray-400">{description}</span>
    <span className="mt-auto block w-full rounded-sm bg-[#f84525] px-3 py-1.5 text-center text-sm font-medium text-white transition group-hover:bg-[#d93a1e]">Open</span>
  </Link>
);

/** Compact title/detail row for legends, reminders, and summary lists. */
export const CompactInfoRow = ({ title, subtitle, leading, trailing, className = "" }) => (
  <div className={`flex min-w-0 items-center gap-2 rounded-sm border border-gray-100 px-2.5 py-2 dark:border-gray-800 ${className}`}>
    {leading && <span className="shrink-0">{leading}</span>}
    <span className="min-w-0 flex-1">
      <span className="block truncate text-sm font-medium text-gray-900 dark:text-gray-100">{title}</span>
      {subtitle && <span className="mt-0.5 block whitespace-normal break-words text-xs text-gray-500 dark:text-gray-400">{subtitle}</span>}
    </span>
    {trailing !== undefined && <span className="shrink-0 text-sm font-semibold text-gray-900 dark:text-gray-100">{trailing}</span>}
  </div>
);

/** Small icon and total row used above compact trend charts. */
export const ChartMetric = ({ icon, label, value, iconClassName = "" }) => (
  <div className="mb-2 flex items-center gap-2.5">
    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${iconClassName || "bg-orange-50 text-[#f84525] dark:bg-orange-950/50 dark:text-orange-300"}`}>
      {icon}
    </span>
    <span className="min-w-0">
      <span className="block text-xs text-gray-500 dark:text-gray-400">{label}</span>
      <span className="block text-sm font-semibold tabular-nums text-gray-800 dark:text-gray-100">{value}</span>
    </span>
  </div>
);

