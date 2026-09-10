import { useCallback, useEffect, useMemo, useState } from "react";
import { FiCalendar, FiChevronLeft, FiChevronRight, FiInfo, FiList } from "react-icons/fi";
import { employeeApi } from "../../api";
import { useToast } from "../../contexts/ToastContext";

const getMonthCursor = (date = new Date()) => date.getFullYear() * 12 + date.getMonth();

const getMonthFromCursor = (cursor) => {
  const year = Math.floor(cursor / 12);
  const monthIndex = cursor % 12;
  return {
    year,
    monthIndex,
    monthNumber: monthIndex + 1,
    label: new Date(year, monthIndex, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    monthShort: new Date(year, monthIndex, 1).toLocaleDateString("en-US", { month: "long" }).toUpperCase(),
  };
};

const getLocalDateKey = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const Card = ({ className = "", children }) => (
  <div className={`bg-white dark:bg-gray-900 border border-[#ffd8cf] dark:border-gray-800 rounded-2xl shadow-sm ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ icon, title, subtitle, action }) => (
  <div className="px-5 py-4 border-b border-[#ffd8cf] dark:border-gray-800 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
    <div className="flex items-start gap-3">
      {icon && (
        <span className="w-9 h-9 rounded-xl bg-[#fff5f3] dark:bg-[#2a1712] text-[#f84525] flex items-center justify-center flex-shrink-0">
          {icon}
        </span>
      )}
      <div>
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{title}</h2>
        {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {action}
  </div>
);

const legendItems = [
  { label: "Holiday", cls: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900" },
  { label: "Working Sat", cls: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900" },
  { label: "Optional Leave", cls: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-900" },
  { label: "Event/Notice", cls: "bg-[#fff5f3] text-[#f84525] border-[#ffd8cf] dark:bg-[#2a1712] dark:text-[#ff9d86] dark:border-[#5c2c1f]" },
  { label: "Today", cls: "bg-[#fff5f3] text-[#f84525] border-[#f84525] dark:bg-[#2a1712]" },
];

const EmployeeLeaveCalendar = () => {
  const toast = useToast();
  const todayKey = useMemo(() => getLocalDateKey(), []);
  const currentMonthCursor = useMemo(() => getMonthCursor(), []);
  const [calendar, setCalendar] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [selectedCalendarItem, setSelectedCalendarItem] = useState(null);
  const [monthCursor, setMonthCursor] = useState(() => getMonthCursor());
  const [flipDirection, setFlipDirection] = useState(null);
  const [isFlipping, setIsFlipping] = useState(false);

  const activeMonth = useMemo(() => getMonthFromCursor(monthCursor), [monthCursor]);
  const activeMonthKey = useMemo(
    () => `${activeMonth.year}-${String(activeMonth.monthNumber).padStart(2, "0")}`,
    [activeMonth]
  );

  const loadLeaveBalance = useCallback(async () => {
    try {
      const leavesRes = await employeeApi.getLeaves();
      setLeaveBalance(leavesRes.data.data?.balance || null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to load leave balance");
    }
  }, [toast]);

  const loadCalendar = useCallback(async () => {
    try {
      const res = await employeeApi.getCalendar(activeMonthKey);
      setCalendar(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to load leave calendar");
    }
  }, [toast, activeMonthKey]);

  useEffect(() => { loadLeaveBalance(); }, [loadLeaveBalance]);
  useEffect(() => { loadCalendar(); }, [loadCalendar]);

  const calendarMap = useMemo(
    () => calendar.reduce((acc, item) => ({ ...acc, [item.dateKey]: item }), {}),
    [calendar]
  );

  const noticeItems = useMemo(
    () => calendar.filter((item) => ["notice", "event"].includes(item.type)),
    [calendar]
  );
  const hrLeaveItems = useMemo(
    () => calendar.filter((item) => ["holiday", "working_saturday", "optional_leave"].includes(item.type)),
    [calendar]
  );

  const buildMonthDays = useCallback(
    (year, monthNumber) => {
      const first = new Date(year, monthNumber - 1, 1);
      const last = new Date(year, monthNumber, 0);
      const blanks = Array.from({ length: first.getDay() }, (_, index) => ({ blank: true, key: `blank-${index}` }));
      const days = Array.from({ length: last.getDate() }, (_, index) => {
        const dayNumber = index + 1;
        const dateKey = `${year}-${String(monthNumber).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`;
        return { dateKey, dayNumber, saved: calendarMap[dateKey] };
      });
      return [...blanks, ...days];
    },
    [calendarMap]
  );

  const activeMonthDays = useMemo(
    () => buildMonthDays(activeMonth.year, activeMonth.monthNumber),
    [buildMonthDays, activeMonth]
  );

  const formatType = (type = "") => type.replace(/_/g, " ");

  const openCalendarDetails = (item) => {
    if (!item) return;
    setSelectedCalendarItem(item);
  };

  // Single continuous element flips through 90deg (edge-on / invisible), we swap
  // the month content at that exact midpoint, then it flips back down to 0deg —
  // reads as one continuous page turn instead of two separate animations.
  const FLIP_HALF_MS = 260;
  const FLIP_TOTAL_MS = 520;

  const runFlip = (direction, applyChange) => {
    if (isFlipping) return;
    setFlipDirection(direction);
    setIsFlipping(true);
    window.setTimeout(applyChange, FLIP_HALF_MS);
    window.setTimeout(() => {
      setIsFlipping(false);
      setFlipDirection(null);
    }, FLIP_TOTAL_MS);
  };

  const goToMonth = (direction) => {
    runFlip(direction, () => {
      setMonthCursor((current) => (direction === "next" ? current + 1 : current - 1));
    });
  };

  const goToToday = () => {
    if (monthCursor === currentMonthCursor || isFlipping) return;
    const direction = monthCursor < currentMonthCursor ? "next" : "prev";
    runFlip(direction, () => setMonthCursor(currentMonthCursor));
  };

  return (
    <div className="space-y-5 pb-8">
      <style>{`
        @keyframes flipNext {
          0%   { transform: perspective(1200px) rotateX(0deg); }
          50%  { transform: perspective(1200px) rotateX(-96deg); }
          100% { transform: perspective(1200px) rotateX(0deg); }
        }
        @keyframes flipPrev {
          0%   { transform: perspective(1200px) rotateX(0deg); }
          50%  { transform: perspective(1200px) rotateX(96deg); }
          100% { transform: perspective(1200px) rotateX(0deg); }
        }
        .diary-page {
          transform-style: preserve-3d;
          backface-visibility: hidden;
          transform-origin: top center;
        }
        .diary-page.flip-next { animation: flipNext 0.52s ease-in-out; }
        .diary-page.flip-prev { animation: flipPrev 0.52s ease-in-out; }
      `}</style>

      <Card className="p-5">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Leave Calendar</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Company yearly calendar with holidays, working Saturdays, optional leaves, notices, and HR-added leave items.
        </p>
      </Card>

      {leaveBalance && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            ["EL", leaveBalance.earned_leave],
            ["SL", leaveBalance.sick_leave],
            ["Urgent", leaveBalance.urgent_leave],
          ].map(([label, item]) => (
            <Card key={label} className="p-4">
              <p className="font-semibold text-gray-900 dark:text-gray-100">{label}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Used {item.used} / {item.total} &middot; Remaining{" "}
                <span className="text-[#f84525] font-semibold">{item.remaining}</span>
              </p>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4">
        {/* ===== Wall-calendar styled card ===== */}
        <div className="relative">
          <Card className="overflow-hidden">
            {/* header band */}
            <div
              className="relative px-5 pt-6 pb-5 text-center"
              style={{ background: "linear-gradient(180deg, #f9a48d 0%, #ffd8cf 55%, #fff5f3 100%)" }}
            >
              <p className="text-[11px] tracking-wide font-semibold text-[#0b0b0b]/80 uppercase">Leave Calendar</p>
              <h3 className="text-3xl font-extrabold text-[#f84525] mt-1 tracking-tight">{activeMonth.year}</h3>
            </div>

            {/* month bar */}
            <div className="bg-[#f84525] px-5 py-3 flex items-center justify-between">
              <span className="text-white font-bold text-sm tracking-wide">
                {String(activeMonth.monthNumber).padStart(2, "0")} / {activeMonth.monthShort}
              </span>
            </div>

            {/* flippable grid area — single element, content swaps at the edge-on midpoint */}
            <div className="relative p-4" style={{ perspective: "1200px" }}>
              <div
                className={`diary-page ${
                  isFlipping && flipDirection === "next"
                    ? "flip-next"
                    : isFlipping && flipDirection === "prev"
                    ? "flip-prev"
                    : ""
                }`}
              >
                <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-[#f84525] mb-2">
                  {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
                    <span key={day}>{day}</span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {activeMonthDays.map((day) => {
                    if (day.blank) return <div key={day.key} className="min-h-14" />;
                    const saved = day.saved;
                    const isToday = day.dateKey === todayKey;
                    const isSunday = new Date(`${day.dateKey}T00:00:00`).getDay() === 0;
                    const className =
                      saved?.type === "holiday"
                        ? "bg-red-50 border-red-200 text-gray-950 dark:bg-red-900/20 dark:border-red-900 dark:text-gray-100"
                        : saved?.type === "working_saturday"
                        ? "bg-green-50 border-green-200 text-gray-950 dark:bg-green-900/20 dark:border-green-900 dark:text-gray-100"
                        : saved?.type === "optional_leave"
                        ? "bg-yellow-50 border-yellow-200 text-gray-950 dark:bg-yellow-900/20 dark:border-yellow-900 dark:text-gray-100"
                        : saved
                        ? "bg-[#fff5f3] border-[#ffd8cf] text-gray-950 dark:bg-[#2a1712] dark:border-[#5c2c1f] dark:text-gray-100"
                        : "bg-white dark:bg-gray-950 border-[#f7e6e0] dark:border-gray-800 text-gray-800 dark:text-gray-100";
                    return (
                      <button
                        type="button"
                        key={day.dateKey}
                        onClick={() => openCalendarDetails(saved)}
                        disabled={!saved}
                        className={`min-h-14 border rounded-md p-1 text-left text-[11px] transition-colors ${
                          saved ? "cursor-pointer hover:ring-2 hover:ring-[#f84525]" : "cursor-default"
                        } ${isToday ? "ring-2 ring-[#f84525] ring-offset-1 dark:ring-offset-gray-900" : ""} ${className}`}
                        title={saved?.title || day.dateKey}
                      >
                        <span
                          className={`inline-flex h-5 min-w-5 items-center justify-center rounded-md px-1 font-bold ${
                            isToday ? "bg-[#f84525] text-white" : isSunday ? "text-[#f84525]" : ""
                          }`}
                        >
                          {day.dayNumber}
                        </span>
                        {saved && (
                          <p className="mt-0.5 line-clamp-2 text-[9px] leading-tight opacity-80">{saved.title}</p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* footer legend */}
            <div className="px-5 pb-4 pt-1">
              <div className="border-t border-[#f7e6e0] dark:border-gray-800 pt-2 flex flex-wrap gap-1.5">
                {legendItems.map((item) => (
                  <span key={item.label} className={`px-2 py-0.5 rounded-full border text-[10px] font-medium ${item.cls}`}>
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
          </Card>

          <div className="mt-3 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => goToMonth("prev")}
              disabled={isFlipping}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 shadow-sm transition-all hover:border-[#f84525] hover:text-[#f84525] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Previous month"
            >
              <FiChevronLeft size={18} />
              Back
            </button>

            <button
              type="button"
              onClick={goToToday}
              disabled={monthCursor === currentMonthCursor || isFlipping}
              className="inline-flex items-center gap-2 rounded-lg bg-[#f84525] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#e13a1c] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiCalendar size={16} />
              Today
            </button>

            <button
              type="button"
              onClick={() => goToMonth("next")}
              disabled={isFlipping}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 shadow-sm transition-all hover:border-[#f84525] hover:text-[#f84525] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Next month"
            >
              Next
              <FiChevronRight size={18} />
            </button>
          </div>

          {noticeItems.length > 0 && (
            <section className="space-y-2.5 mt-4">
              <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100">Latest Notices</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {noticeItems.map((item) => (
                  <button
                    type="button"
                    key={item._id || item.dateKey}
                    onClick={() => openCalendarDetails(item)}
                    className="text-left border border-[#ffd8cf] dark:border-[#5c2c1f] rounded-xl p-3.5 bg-[#fff5f3] dark:bg-[#2a1712] hover:border-[#f84525] transition-colors"
                  >
                    <p className="text-xs text-[#f84525] font-semibold uppercase tracking-wide">{item.type}</p>
                    <p className="font-semibold mt-1 text-gray-900 dark:text-gray-100">{item.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.dateKey}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                      {item.description || "No description"}
                    </p>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>

        <Card className="overflow-hidden flex flex-col">
          <CardHeader
            icon={<FiList />}
            title="Official Calendar List"
            subtitle="Holidays, optional leaves, and working Saturdays for the selected month."
          />
          <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-[#f7e6e0] dark:divide-gray-800">
            {hrLeaveItems.length === 0 ? (
              <p className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">No HR leave items added yet.</p>
            ) : (
              hrLeaveItems.map((item) => (
                <button
                  type="button"
                  key={item._id || item.dateKey}
                  onClick={() => openCalendarDetails(item)}
                  className="w-full text-left px-5 py-3.5 hover:bg-[#fff8f6] dark:hover:bg-gray-800/60 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{item.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.dateKey}</p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-[#fff5f3] dark:bg-[#2a1712] text-[#f84525] capitalize flex-shrink-0">
                      {item.type.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">{item.description || "No description"}</p>
                </button>
              ))
            )}
          </div>
        </Card>
      </div>

      {selectedCalendarItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-5 border-b border-[#f7e6e0] dark:border-gray-800 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#f84525]">
                  {formatType(selectedCalendarItem.type)}
                </p>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                  {selectedCalendarItem.title || "Calendar Detail"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCalendarItem(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-400 text-lg"
                aria-label="Close calendar detail"
              >
                &times;
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="border border-[#f7e6e0] dark:border-gray-800 rounded-xl p-3.5">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Date</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mt-1">{selectedCalendarItem.dateKey}</p>
                </div>
                <div className="border border-[#f7e6e0] dark:border-gray-800 rounded-xl p-3.5">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Day</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mt-1">
                    {selectedCalendarItem.day ||
                      new Date(`${selectedCalendarItem.dateKey}T00:00:00`).toLocaleDateString("en-US", { weekday: "long" })}
                  </p>
                </div>
                <div className="border border-[#f7e6e0] dark:border-gray-800 rounded-xl p-3.5 sm:col-span-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <FiInfo /> Type
                  </p>
                  <p className="font-semibold capitalize text-gray-900 dark:text-gray-100 mt-1">
                    {formatType(selectedCalendarItem.type)}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Description</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 whitespace-pre-wrap">
                  {selectedCalendarItem.description || "No description added."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeLeaveCalendar;