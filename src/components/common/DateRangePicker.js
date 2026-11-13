import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { FiCalendar, FiChevronDown, FiChevronLeft, FiChevronRight, FiX } from "react-icons/fi";

const getDateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const parseDateKey = (value) => {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};
const formatDate = (value) => {
  const date = parseDateKey(value);
  return date ? date.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }) : "Select date";
};

const DateRangePicker = ({ value, onApply, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(value || { start: "", end: "" });
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const selected = parseDateKey(value?.start);
    return selected || new Date();
  });
  const todayKey = getDateKey(new Date());
  const monthNames = useMemo(() => Array.from({ length: 12 }, (_, month) => new Date(2024, month, 1).toLocaleDateString(undefined, { month: "long" })), []);
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const yearOptions = useMemo(() => Array.from({ length: 41 }, (_, index) => new Date().getFullYear() - 20 + index), []);
  const firstOfMonth = new Date(year, month, 1);
  const calendarStart = new Date(year, month, 1 - firstOfMonth.getDay());
  const calendarDays = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(calendarStart);
    date.setDate(calendarStart.getDate() + index);
    return date;
  });
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, index) => new Date(2024, 0, 7 + index).toLocaleDateString(undefined, { weekday: "short" })), []);
  const rangeText = draft.start && draft.end
    ? `${formatDate(draft.start)}  →  ${formatDate(draft.end)}`
    : draft.start
      ? `${formatDate(draft.start)}  →  Select end date`
      : "Choose a start and end date";
  const hasValidRange = Boolean(draft.start && draft.end && draft.start <= draft.end);
  const canApply = hasValidRange || (!draft.start && !draft.end);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const openPicker = () => {
    setDraft(value || { start: "", end: "" });
    const selected = parseDateKey(value?.start);
    setVisibleMonth(selected || new Date());
    setIsOpen(true);
  };

  const moveMonth = (offset) => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));

  const selectDate = (date) => {
    const selectedKey = getDateKey(date);
    setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    setDraft((current) => {
      if (!current.start || current.end) return { start: selectedKey, end: "" };
      if (selectedKey < current.start) return { start: selectedKey, end: "" };
      return { ...current, end: selectedKey };
    });
  };

  const clearRange = () => setDraft({ start: "", end: "" });
  const chooseToday = () => {
    setDraft({ start: todayKey, end: todayKey });
    setVisibleMonth(new Date());
  };
  const applyRange = () => {
    if (!canApply) return;
    onApply(draft);
    setIsOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={openPicker}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className={`inline-flex min-h-10 w-full items-center justify-between gap-3 rounded-sm border border-gray-200 bg-white px-3 py-2 text-left text-sm text-gray-800 shadow-sm transition hover:border-[#f84525] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f84525]/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 sm:min-w-[250px] sm:w-auto ${className}`}
      >
        <span className="flex min-w-0 items-center gap-2">
          <FiCalendar className="h-4 w-4 shrink-0 text-[#f84525]" />
          <span className="truncate">{value?.start && value?.end ? `${formatDate(value.start)} – ${formatDate(value.end)}` : "Choose date range"}</span>
        </span>
        <FiChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
      </button>

      {isOpen && createPortal(
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-gray-950/55 p-2 backdrop-blur-[2px] sm:p-4"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setIsOpen(false); }}
        >
          <section role="dialog" aria-modal="true" aria-labelledby="date-range-title" className="w-full max-w-[410px] overflow-hidden rounded-2xl border border-orange-100 bg-[#fffdfa] shadow-2xl dark:border-gray-700 dark:bg-gray-900">
            <header className="flex items-start justify-between gap-3 bg-gradient-to-r from-[#f84525] to-[#f26a28] px-5 py-4 text-white">
              <div>
                <h2 id="date-range-title" className="text-base font-semibold">Select Date Range</h2>
                <p className="mt-1 text-xs text-white/80">Dashboard charts update after you apply.</p>
              </div>
              <button type="button" onClick={() => setIsOpen(false)} aria-label="Close date picker" className="rounded-md p-1.5 text-white/85 transition hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70">
                <FiX className="h-5 w-5" />
              </button>
            </header>

            <div className="p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <button type="button" onClick={() => moveMonth(-1)} aria-label="Previous month" className="flex h-9 w-9 items-center justify-center rounded-lg border border-orange-100 bg-white text-[#f84525] transition hover:bg-orange-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700">
                  <FiChevronLeft />
                </button>
                <div className="flex min-w-0 flex-1 justify-center gap-2">
                  <label className="relative">
                    <span className="sr-only">Month</span>
                    <select value={month} onChange={(event) => setVisibleMonth(new Date(year, Number(event.target.value), 1))} className="h-9 max-w-[150px] appearance-none rounded-lg border border-orange-100 bg-white py-1 pl-3 pr-8 text-sm font-medium text-gray-800 outline-none focus:border-[#f84525] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
                      {monthNames.map((name, index) => <option key={name} value={index}>{name}</option>)}
                    </select>
                    <FiChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                  </label>
                  <label className="relative">
                    <span className="sr-only">Year</span>
                    <select value={year} onChange={(event) => setVisibleMonth(new Date(Number(event.target.value), month, 1))} className="h-9 w-[86px] appearance-none rounded-lg border border-orange-100 bg-white py-1 pl-3 pr-7 text-sm font-medium text-gray-800 outline-none focus:border-[#f84525] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
                      {yearOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                    </select>
                    <FiChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                  </label>
                </div>
                <button type="button" onClick={() => moveMonth(1)} aria-label="Next month" className="flex h-9 w-9 items-center justify-center rounded-lg border border-orange-100 bg-white text-[#f84525] transition hover:bg-orange-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700">
                  <FiChevronRight />
                </button>
              </div>

              <div className="mt-4 flex min-h-8 items-center justify-end">
                <p aria-live="polite" className="rounded-full bg-orange-50 px-3 py-1.5 text-right text-xs font-medium text-[#b9341b] dark:bg-orange-950/40 dark:text-orange-200">{rangeText}</p>
              </div>

              <div className="mt-2 grid grid-cols-7 gap-1 text-center">
                {weekDays.map((day) => <span key={day} className="py-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">{day}</span>)}
                {calendarDays.map((date) => {
                  const dateKey = getDateKey(date);
                  const inMonth = date.getMonth() === month;
                  const isStart = dateKey === draft.start;
                  const isEnd = dateKey === draft.end;
                  const isInRange = draft.start && draft.end && dateKey > draft.start && dateKey < draft.end;
                  const isToday = dateKey === todayKey;
                  return (
                    <button
                      key={dateKey}
                      type="button"
                      onClick={() => selectDate(date)}
                      aria-label={date.toLocaleDateString(undefined, { dateStyle: "full" })}
                      aria-pressed={isStart || isEnd || Boolean(isInRange)}
                      className={`relative mx-auto flex aspect-square w-full max-w-10 items-center justify-center rounded-lg text-xs transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f84525]/40 ${
                        isStart || isEnd
                          ? "bg-[#f84525] font-semibold text-white shadow-sm"
                          : isInRange
                            ? "bg-orange-100 font-medium text-[#a8321b] dark:bg-orange-950/60 dark:text-orange-200"
                            : inMonth
                              ? "text-gray-700 hover:bg-orange-50 dark:text-gray-200 dark:hover:bg-gray-800"
                              : "text-gray-300 hover:bg-gray-50 dark:text-gray-600 dark:hover:bg-gray-800"
                      } ${isToday && !isStart && !isEnd ? "ring-1 ring-inset ring-[#f84525]/60" : ""}`}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>

              <footer className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-orange-100 pt-4 dark:border-gray-800">
                <div className="flex gap-2">
                  <button type="button" onClick={chooseToday} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:border-[#f84525] hover:text-[#f84525] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">Today</button>
                  <button type="button" onClick={clearRange} className="rounded-lg bg-orange-50 px-3 py-2 text-xs font-medium text-[#c6381e] transition hover:bg-orange-100 dark:bg-orange-950/40 dark:text-orange-200 dark:hover:bg-orange-950/70">Clear</button>
                </div>
                <div className="ml-auto flex gap-2">
                  <button type="button" onClick={() => setIsOpen(false)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700">Cancel</button>
                  <button type="button" onClick={applyRange} disabled={!canApply} className="rounded-lg bg-[#f84525] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#d93a1e] disabled:cursor-not-allowed disabled:opacity-40">Apply</button>
                </div>
              </footer>
            </div>
          </section>
        </div>,
        document.body
      )}
    </>
  );
};

export default DateRangePicker;
