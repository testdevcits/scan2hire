const EmptyState = ({ text, title, message, variant = "empty", action, className = "" }) => {
  const tone = variant === "error"
    ? "border-y border-red-100 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
    : "text-gray-500 dark:text-gray-400";
  return (
    <div
      role={variant === "error" ? "alert" : undefined}
      className={`px-4 py-7 text-center text-sm ${tone} ${className}`}
    >
      {(title || text) && <p className={title ? "font-semibold" : ""}>{title || text}</p>}
      {message && <p className={title || text ? "mt-1" : ""}>{message}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
};

export default EmptyState;
