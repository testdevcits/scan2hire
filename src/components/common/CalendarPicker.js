import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { FiCalendar, FiChevronDown, FiChevronLeft, FiChevronRight, FiX } from "react-icons/fi";

const toKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const todayKeyForZone = (date, timeZone) => timeZone
  ? new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date)
  : toKey(date);
const fromKey = (value) => {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day || 1);
};

const CalendarPicker = ({ value, onChange, mode = "date", label, labelClassName = "", className = "", error = "", inlineLabel = false, timeZone, disabled = false }) => {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value || "");
  const [visibleMonth, setVisibleMonth] = useState(() => fromKey(value) || new Date());
  const isMonth = mode === "month";
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const monthNames = useMemo(() => Array.from({ length: 12 }, (_, index) => new Date(2024, index, 1).toLocaleDateString(undefined, { month: "long" })), []);
  const years = useMemo(() => Array.from({ length: 81 }, (_, index) => new Date().getFullYear() - 40 + index), []);
  const calendarDays = useMemo(() => {
    const first = new Date(year, month, 1);
    const start = new Date(year, month, 1 - first.getDay());
    return Array.from({ length: 42 }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return day;
    });
  }, [month, year]);
  const weekdays = useMemo(() => Array.from({ length: 7 }, (_, index) => new Date(2024, 0, 7 + index).toLocaleDateString(undefined, { weekday: "short" })), []);
  const today = todayKeyForZone(new Date(), timeZone);
  const selected = fromKey(value);
  const triggerText = selected
    ? selected.toLocaleDateString(undefined, isMonth ? { month: "long", year: "numeric" } : { day: "2-digit", month: "short", year: "numeric" })
    : isMonth ? "Select month" : "Select date";

  useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event) => { if (event.key === "Escape") setOpen(false); };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  const openPicker = () => {
    setDraft(value || "");
    setVisibleMonth(fromKey(value) || new Date());
    setOpen(true);
  };
  const apply = () => {
    onChange(draft);
    setOpen(false);
  };
  const selectDay = (day) => setDraft(toKey(day));
  const selectMonth = (selectedMonth) => {
    setVisibleMonth(new Date(year, selectedMonth, 1));
    setDraft(`${year}-${String(selectedMonth + 1).padStart(2, "0")}`);
  };

  return (
    <>
      <div className={inlineLabel ? "flex min-w-0 items-center gap-2" : "flex min-w-0 flex-col"}>
      {label ? <span className={`${inlineLabel ? "w-[92px] shrink-0" : "mb-1 block w-full text-left"} ${labelClassName || "font-medium text-sm text-gray-700 dark:text-gray-200 sm:text-base"}`}>{label}</span> : null}
      <button type="button" onClick={openPicker} disabled={disabled} aria-haspopup="dialog" aria-expanded={open} className={`inline-flex h-10 min-w-0 items-center justify-between gap-3 rounded-sm border border-gray-300 bg-white px-3 py-2 text-left text-sm text-gray-900 transition hover:border-[#f84525] focus:outline-none focus:ring-2 focus:ring-[#f84525] disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 disabled:hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:disabled:bg-gray-900 ${inlineLabel ? "flex-1" : "w-full"} ${className}`}>
        <span className="flex min-w-0 items-center gap-2"><FiCalendar className="h-4 w-4 shrink-0 text-[#f84525]" /><span className="truncate">{triggerText}</span></span>
        <FiChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
      </button>
      </div>
      {error ? <span className="mt-1 block text-xs text-red-500">{error}</span> : null}
      {open && createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-gray-950/55 p-3 backdrop-blur-[2px]" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="calendar-picker-title" className="w-full max-w-[410px] overflow-hidden rounded-2xl border border-orange-100 bg-[#fffdfa] shadow-2xl dark:border-gray-700 dark:bg-gray-900">
            <header className="flex items-start justify-between gap-3 bg-gradient-to-r from-[#f84525] to-[#f26a28] px-5 py-4 text-white">
              <div><h2 id="calendar-picker-title" className="text-base font-semibold">Select {isMonth ? "Report Month" : "Date"}</h2><p className="mt-1 text-xs text-white/80">Choose a {isMonth ? "month" : "day"} to update the employee report.</p></div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close calendar" className="rounded-md p-1.5 text-white/85 hover:bg-white/15"><FiX className="h-5 w-5" /></button>
            </header>
            <div className="p-4 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <button type="button" onClick={() => setVisibleMonth(new Date(year, month - 1, 1))} aria-label="Previous month" className="flex h-9 w-9 items-center justify-center rounded-lg border border-orange-100 bg-white text-[#f84525] hover:bg-orange-50 dark:border-gray-700 dark:bg-gray-800"><FiChevronLeft /></button>
                <div className="flex min-w-0 flex-1 justify-center gap-2">
                  <label className="relative"><span className="sr-only">Month</span><select value={month} onChange={(event) => setVisibleMonth(new Date(year, Number(event.target.value), 1))} className="h-9 max-w-[150px] appearance-none rounded-lg border border-orange-100 bg-white py-1 pl-3 pr-8 text-sm font-medium text-gray-800 outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">{monthNames.map((name, index) => <option key={name} value={index}>{name}</option>)}</select><FiChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" /></label>
                  <label className="relative"><span className="sr-only">Year</span><select value={year} onChange={(event) => setVisibleMonth(new Date(Number(event.target.value), month, 1))} className="h-9 w-[86px] appearance-none rounded-lg border border-orange-100 bg-white py-1 pl-3 pr-7 text-sm font-medium text-gray-800 outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">{years.map((item) => <option key={item} value={item}>{item}</option>)}</select><FiChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" /></label>
                </div>
                <button type="button" onClick={() => setVisibleMonth(new Date(year, month + 1, 1))} aria-label="Next month" className="flex h-9 w-9 items-center justify-center rounded-lg border border-orange-100 bg-white text-[#f84525] hover:bg-orange-50 dark:border-gray-700 dark:bg-gray-800"><FiChevronRight /></button>
              </div>
              {isMonth ? (
                <div className="mt-4 grid grid-cols-3 gap-2">{monthNames.map((name, index) => {
                  const key = `${year}-${String(index + 1).padStart(2, "0")}`;
                  const active = draft === key;
                  return <button key={name} type="button" aria-pressed={active} onClick={() => selectMonth(index)} className={`rounded-lg px-3 py-3 text-sm transition ${active ? "bg-[#f84525] font-semibold text-white" : "text-gray-700 hover:bg-orange-50 dark:text-gray-200 dark:hover:bg-gray-800"}`}>{name}</button>;
                })}</div>
              ) : (
                <div className="mt-4 grid grid-cols-7 gap-1 text-center">
                  {weekdays.map((day) => <span key={day} className="py-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">{day}</span>)}
                  {calendarDays.map((day) => {
                    const key = toKey(day);
                    const active = draft === key;
                    const inMonth = day.getMonth() === month;
                    return <button key={key} type="button" onClick={() => selectDay(day)} aria-pressed={active} aria-label={day.toLocaleDateString(undefined, { dateStyle: "full" })} className={`relative mx-auto flex aspect-square w-full max-w-10 items-center justify-center rounded-lg text-xs transition ${active ? "bg-[#f84525] font-semibold text-white shadow-sm" : inMonth ? "text-gray-700 hover:bg-orange-50 dark:text-gray-200 dark:hover:bg-gray-800" : "text-gray-300 dark:text-gray-600"} ${key === today && !active ? "ring-1 ring-inset ring-[#f84525]/60" : ""}`}>{day.getDate()}</button>;
                  })}
                </div>
              )}
              <footer className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-orange-100 pt-4 dark:border-gray-800">
                <div className="flex gap-2"><button type="button" onClick={() => { const now = new Date(); const key = todayKeyForZone(now, timeZone); const todayDate = fromKey(key); setDraft(isMonth ? key.slice(0, 7) : key); setVisibleMonth(todayDate); }} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:border-[#f84525] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">{isMonth ? "This month" : "Today"}</button><button type="button" onClick={() => { setDraft(""); onChange(""); setOpen(false); }} className="rounded-lg bg-orange-50 px-3 py-2 text-xs font-medium text-[#c6381e] hover:bg-orange-100 dark:bg-orange-950/40 dark:text-orange-200">Clear</button></div>
                <div className="ml-auto flex gap-2"><button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">Cancel</button><button type="button" onClick={apply} disabled={!draft} className="rounded-lg bg-[#f84525] px-4 py-2 text-xs font-semibold text-white hover:bg-[#d93a1e] disabled:cursor-not-allowed disabled:opacity-40">Apply</button></div>
              </footer>
            </div>
          </section>
        </div>, document.body
      )}
    </>
  );
};

export default CalendarPicker;
