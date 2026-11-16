import Pagination, { usePagination } from "./Pagination";
import EmptyState from "./EmptyState";
import CommonLoader from "./CommonLoader";

/** Shared responsive data table. Supports local or server supplied pagination. */
const CommonTable = ({
  columns = [],
  data = [],
  actions,
  toolbar,
  error,
  errorAction,
  emptyText = "No data found",
  pagination,
  loading = false,
  loadingText = "Loading records...",
  showPagination = true,
  className = "",
  actionsLayout = "row",
  tableClassName = "",
  mobileLayout = "rows",
}) => {
  const localPagination = usePagination(data);
  const pageState = pagination || localPagination;
  const pageData = pagination ? data : localPagination.pageItems;
  const totalItems = pagination?.totalItems ?? data.length;

  return (
    <div className={`overflow-hidden rounded-sm border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 ${className}`}>
      {toolbar}
      {error && <EmptyState variant="error" text={error} action={errorAction} className="py-3" />}
      {loading ? (
        <CommonLoader text={loadingText} compact />
      ) : totalItems === 0 ? (
        !error && <EmptyState text={emptyText} />
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className={`w-full min-w-full text-left text-sm ${tableClassName}`}>
              <thead className="border-b bg-gray-50 text-xs uppercase text-gray-600 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-300">
                <tr>
                  {columns.map((column) => (
                    <th key={column.accessor} className={`whitespace-nowrap px-4 py-3 font-semibold ${column.headerClassName || ""}`}>{column.header}</th>
                  ))}
                  {actions && <th className="px-4 py-3 font-semibold">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {pageData.map((row, index) => (
                  <tr key={row._id || row.key || index} className="border-t text-gray-700 hover:bg-[#fff8f6] dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-800">
                    {columns.map((column) => (
                      <td key={column.accessor} className={`max-w-xs px-4 py-3 align-top ${column.cellClassName || ""}`}>
                        {column.render ? column.render(row[column.accessor], row) : row[column.accessor] ?? "N/A"}
                      </td>
                    ))}
                    {actions && (
                      <td className="px-4 py-3">
                        <div className={`flex min-w-max gap-2 ${actionsLayout === "stack" ? "w-24 flex-col items-stretch" : "flex-nowrap"}`}>
                          {actions.map((action, actionIndex) => (
                            <button
                              key={action.key || actionIndex}
                              type="button"
                              onClick={() => action.onClick(row)}
                              disabled={typeof action.disabled === "function" ? action.disabled(row) : action.disabled}
                              title={action.title || (action.iconOnly ? (typeof action.label === "string" ? action.label : "View") : undefined)}
                              aria-label={action.iconOnly ? (action.title || (typeof action.label === "string" ? action.label : "View")) : undefined}
                              className={`whitespace-nowrap rounded-sm px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:!bg-gray-100 disabled:!text-gray-400 disabled:!shadow-none ${action.iconOnly ? "inline-flex min-h-8 items-center justify-center !px-2 !py-1.5" : ""} ${action.className || "bg-blue-500 text-white"}`}
                            >
                              {action.iconOnly ? action.icon : typeof action.label === "function" ? action.label(row) : action.label}
                            </button>
                          ))}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="space-y-3 p-3 md:hidden">
            {pageData.map((row, index) => (
              <div key={row._id || row.key || index} className="rounded-sm border border-gray-200 bg-gray-50 p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="space-y-1 text-sm">
                  {columns.map((column) => (
                    <div key={column.accessor} className={mobileLayout === "stack" ? "space-y-2 py-2" : "grid grid-cols-[105px_1fr] gap-2"}>
                      <span className="font-semibold text-gray-600 dark:text-gray-300">{column.header}:</span>
                      <div className={`min-w-0 break-words text-gray-900 dark:text-gray-100 ${mobileLayout === "stack" ? "text-left" : "text-right"}`}>
                        {column.render ? column.render(row[column.accessor], row) : row[column.accessor] ?? "N/A"}
                      </div>
                    </div>
                  ))}
                </div>
                {actions && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {actions.map((action, actionIndex) => (
                      <button
                        key={action.key || actionIndex}
                        type="button"
                        onClick={() => action.onClick(row)}
                        disabled={typeof action.disabled === "function" ? action.disabled(row) : action.disabled}
                        title={action.title || (action.iconOnly ? (typeof action.label === "string" ? action.label : "View") : undefined)}
                        aria-label={action.iconOnly ? (action.title || (typeof action.label === "string" ? action.label : "View")) : undefined}
                        className={`${action.iconOnly ? "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-sm" : "flex-1 rounded-sm px-3 py-2"} text-xs font-semibold disabled:cursor-not-allowed disabled:!bg-gray-100 disabled:!text-gray-400 disabled:!shadow-none ${action.className || "bg-blue-500 text-white"}`}
                      >
                        {action.iconOnly ? action.icon : typeof action.label === "function" ? action.label(row) : action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
      {showPagination && <Pagination {...pageState} totalItems={totalItems} />}
    </div>
  );
};

export default CommonTable;
