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
  emptyText = "No data found",
  pagination,
  loading = false,
  loadingText = "Loading records...",
  showPagination = true,
  className = "",
}) => {
  const localPagination = usePagination(data);
  const pageState = pagination || localPagination;
  const pageData = pagination ? data : localPagination.pageItems;
  const totalItems = pagination?.totalItems ?? data.length;

  return (
    <div className={`overflow-hidden rounded-sm border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 ${className}`}>
      {toolbar}
      {error && <EmptyState variant="error" text={error} className="py-3" />}
      {loading ? (
        <CommonLoader text={loadingText} compact />
      ) : totalItems === 0 ? (
        !error && <EmptyState text={emptyText} />
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-full text-left text-sm">
              <thead className="border-b bg-gray-50 text-xs uppercase text-gray-600 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-300">
                <tr>
                  {columns.map((column) => (
                    <th key={column.accessor} className="whitespace-nowrap px-4 py-3 font-semibold">{column.header}</th>
                  ))}
                  {actions && <th className="px-4 py-3 font-semibold">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {pageData.map((row, index) => (
                  <tr key={row._id || index} className="border-t text-gray-700 hover:bg-[#fff8f6] dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-800">
                    {columns.map((column) => (
                      <td key={column.accessor} className="max-w-xs px-4 py-3 align-top">
                        {column.render ? column.render(row[column.accessor], row) : row[column.accessor] || "N/A"}
                      </td>
                    ))}
                    {actions && (
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {actions.map((action, actionIndex) => (
                            <button
                              key={action.key || actionIndex}
                              type="button"
                              onClick={() => action.onClick(row)}
                              className={`rounded-sm px-3 py-1.5 text-xs font-semibold ${action.className || "bg-blue-500 text-white"}`}
                            >
                              {action.label}
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
              <div key={row._id || index} className="rounded-sm border border-gray-200 bg-gray-50 p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <div className="space-y-1 text-sm">
                  {columns.map((column) => (
                    <div key={column.accessor} className="grid grid-cols-[105px_1fr] gap-2">
                      <span className="font-semibold text-gray-600 dark:text-gray-300">{column.header}:</span>
                      <span className="break-words text-right text-gray-900 dark:text-gray-100">
                        {column.render ? column.render(row[column.accessor], row) : row[column.accessor] || "N/A"}
                      </span>
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
                        className={`flex-1 rounded-sm px-3 py-2 text-xs font-semibold ${action.className || "bg-blue-500 text-white"}`}
                      >
                        {action.label}
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
