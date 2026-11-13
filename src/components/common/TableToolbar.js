import SearchInput from "./SearchInput";

/** Shared search/status bar for tables and tabular lists. */
const TableToolbar = ({
  value,
  onChange,
  placeholder = "Search...",
  label = "Search",
  summary,
  loading = false,
  loadingText = "Loading…",
  className = "",
}) => (
  <div className={`flex flex-col gap-3 border-b border-gray-100 p-3 dark:border-gray-800 sm:flex-row sm:items-end sm:justify-between ${className}`}>
    <SearchInput
      value={value}
      onChange={onChange}
      label={label}
      placeholder={placeholder}
      className="w-full sm:max-w-lg"
    />
    <div className="flex items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400 sm:justify-end">
      {summary && <span>{summary}</span>}
      {loading && <span className="font-medium text-[#f84525]" role="status">{loadingText}</span>}
    </div>
  </div>
);

export default TableToolbar;
