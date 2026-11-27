import { FiCalendar, FiRotateCcw } from "react-icons/fi";

const DateRangeFilter = ({ from, to, onFromChange, onToChange, onApply, onClear }) => {
  const clearFilters = () => {
    onFromChange("");
    onToChange("");
    if (onClear) onClear();
  };

  const invalidRange = Boolean(from && to && from > to);

  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <div className="min-w-[170px]">
        <label className="mb-1 block text-xs font-semibold text-gray-500">From date</label>
        <div className="relative">
          <FiCalendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="date"
            value={from}
            max={to || undefined}
            onChange={(event) => onFromChange(event.target.value)}
            className="h-10 w-full rounded-md border border-gray-300 pl-9 pr-3 text-sm outline-none focus:border-[#f84525] focus:ring-2 focus:ring-red-100"
          />
        </div>
      </div>

      <div className="min-w-[170px]">
        <label className="mb-1 block text-xs font-semibold text-gray-500">To date</label>
        <div className="relative">
          <FiCalendar className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="date"
            value={to}
            min={from || undefined}
            onChange={(event) => onToChange(event.target.value)}
            className="h-10 w-full rounded-md border border-gray-300 pl-9 pr-3 text-sm outline-none focus:border-[#f84525] focus:ring-2 focus:ring-red-100"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onApply}
        disabled={invalidRange}
        className="h-10 rounded-md bg-[#f84525] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#df3820] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Apply Filter
      </button>

      {(from || to) && (
        <button
          type="button"
          onClick={clearFilters}
          className="flex h-10 items-center gap-2 rounded-md border border-gray-300 px-4 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
        >
          <FiRotateCcw /> Clear
        </button>
      )}

      {invalidRange && (
        <p className="w-full text-xs font-medium text-red-600">
          From date cannot be after the to date.
        </p>
      )}
    </div>
  );
};

export default DateRangeFilter;
