import { useEffect, useMemo, useState } from "react";
import CustomDropdown from "./CustomDropdown";

const pageSizeOptions = [10, 20, 50, 100];

export const usePagination = (items = [], resetKeys = []) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, resetKeys);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const pageItems = useMemo(
    () => items.slice((page - 1) * pageSize, page * pageSize),
    [items, page, pageSize]
  );

  return { page, pageItems, pageSize, setPage, setPageSize, totalItems, totalPages };
};

const Pagination = ({ page, pageSize, setPage, setPageSize, totalItems, totalPages }) => {
  // Keep the table footer clean when every row already fits on one page.
  if (totalItems <= 0 || totalItems <= pageSize || totalPages <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex flex-col gap-3 border-t border-gray-100 px-3 py-3 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between sm:px-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Showing {start}-{end} of {totalItems}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <CustomDropdown
          label="Rows"
          value={pageSize}
          onChange={(nextValue) => setPageSize(Number(nextValue))}
          options={pageSizeOptions.map((size) => ({ value: size, label: String(size) }))}
          searchable={false}
          showPlaceholder={false}
          compact
          placement="top"
          className="text-gray-600 dark:text-gray-300"
        />
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Page {page} of {totalPages}
        </span>
        <button type="button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-sm border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:border-[#f84525] hover:text-[#f84525] disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:text-orange-300">Previous</button>
        <button type="button" disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} className="rounded-sm border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:border-[#f84525] hover:text-[#f84525] disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:text-orange-300">Next</button>
      </div>
    </div>
  );
};

export default Pagination;
