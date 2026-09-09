import { useEffect, useMemo, useState } from "react";
import Button from "./Button";

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
  if (totalItems <= 0) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className="border-t px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-gray-500">
        Showing {start}-{end} of {totalItems}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex items-center gap-2 text-sm text-gray-600">
          Rows
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="rounded-sm border border-gray-300 px-2 py-1.5 text-sm focus:border-[#f84525] focus:outline-none focus:ring-2 focus:ring-[#f84525]/10"
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <span className="text-sm text-gray-500">
          Page {page} of {totalPages}
        </span>
        <Button text="Previous" variant="secondary" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} />
        <Button text="Next" variant="secondary" disabled={page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} />
      </div>
    </div>
  );
};

export default Pagination;
