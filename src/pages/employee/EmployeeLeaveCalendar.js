import { useCallback, useEffect, useMemo, useState } from "react";
import { employeeApi } from "../../api";
import CommonLoader from "../../components/common/CommonLoader";
import { useToast } from "../../contexts/ToastContext";

const EmployeeLeaveCalendar = () => {
  const toast = useToast();
  const [calendar, setCalendar] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [calendarRes, leavesRes] = await Promise.all([
        employeeApi.getCalendar(null, new Date().getFullYear()),
        employeeApi.getLeaves(),
      ]);
      setCalendar(calendarRes.data.data || []);
      setLeaveBalance(leavesRes.data.data?.balance || null);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Unable to load leave calendar"
      );
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const calendarMap = useMemo(
    () =>
      calendar.reduce((acc, item) => ({ ...acc, [item.dateKey]: item }), {}),
    [calendar]
  );

  const noticeItems = useMemo(
    () => calendar.filter((item) => ["notice", "event"].includes(item.type)),
    [calendar]
  );
  const hrLeaveItems = useMemo(
    () =>
      calendar.filter((item) =>
        ["holiday", "working_saturday", "optional_leave"].includes(item.type)
      ),
    [calendar]
  );

  const buildMonthDays = useCallback(
    (year, monthNumber) => {
      const first = new Date(year, monthNumber - 1, 1);
      const last = new Date(year, monthNumber, 0);
      const blanks = Array.from({ length: first.getDay() }, (_, index) => ({
        blank: true,
        key: `blank-${index}`,
      }));
      const days = Array.from({ length: last.getDate() }, (_, index) => {
        const dayNumber = index + 1;
        const dateKey = `${year}-${String(monthNumber).padStart(
          2,
          "0"
        )}-${String(dayNumber).padStart(2, "0")}`;
        return {
          dateKey,
          dayNumber,
          saved: calendarMap[dateKey],
        };
      });
      return [...blanks, ...days];
    },
    [calendarMap]
  );

  const calendarMonths = useMemo(() => {
    const year = new Date().getFullYear();
    return Array.from({ length: 12 }, (_, index) => ({
      label: new Date(year, index, 1).toLocaleDateString("en-US", {
        month: "long",
      }),
      days: buildMonthDays(year, index + 1),
    }));
  }, [buildMonthDays]);

  if (loading) return <CommonLoader text="Loading leave calendar..." />;

  return (
    <div className="space-y-5">
      <section className="bg-white dark:bg-gray-900 rounded-sm shadow p-5">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Leave Calendar
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Company yearly calendar with holidays, working Saturdays, optional
          leaves, notices, and HR-added leave items.
        </p>
      </section>

      {leaveBalance && (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            ["EL", leaveBalance.earned_leave],
            ["SL", leaveBalance.sick_leave],
            ["Urgent", leaveBalance.urgent_leave],
          ].map(([label, item]) => (
            <div
              key={label}
              className="bg-white dark:bg-gray-900 rounded-sm shadow p-4"
            >
              <p className="font-semibold dark:text-white">{label}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Used {item.used} / {item.total} | Remaining {item.remaining}
              </p>
            </div>
          ))}
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-sm shadow p-4">
          {noticeItems.length > 0 && (
            <section className="space-y-2 mb-4">
              <h2 className="font-semibold text-sm dark:text-white">
                Latest Notices
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {noticeItems.map((item) => (
                  <div
                    key={item._id || item.dateKey}
                    className="border rounded-sm p-3 bg-[#fff5f3]"
                  >
                    <p className="text-xs text-[#f84525] font-semibold uppercase">
                      {item.type}
                    </p>
                    <p className="font-semibold mt-1">{item.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{item.dateKey}</p>
                    <p className="text-sm text-gray-700 mt-2">
                      {item.description || "No description"}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <div className="flex gap-2 text-xs flex-wrap mb-4">
            <span className="px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded-sm">
              Holiday
            </span>
            <span className="px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded-sm">
              Working Sat
            </span>
            <span className="px-2 py-1 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-sm">
              Optional Leave
            </span>
            <span className="px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-sm">
              Event/Notice
            </span>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {calendarMonths.map((monthBlock) => (
              <div
                key={monthBlock.label}
                className="border dark:border-gray-800 rounded-sm p-3"
              >
                <h3 className="font-semibold text-sm mb-2 dark:text-white">
                  {monthBlock.label}
                </h3>
                <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-gray-500 mb-1">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (day) => (
                      <span key={day}>{day}</span>
                    )
                  )}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {monthBlock.days.map((day) => {
                    if (day.blank)
                      return (
                        <div
                          key={`${monthBlock.label}-${day.key}`}
                          className="min-h-12"
                        />
                      );
                    const saved = day.saved;
                    const className =
                      saved?.type === "holiday"
                        ? "bg-red-50 border-red-200 text-gray-950"
                        : saved?.type === "working_saturday"
                        ? "bg-green-50 border-green-200 text-gray-950"
                        : saved?.type === "optional_leave"
                        ? "bg-yellow-50 border-yellow-200 text-gray-950"
                        : saved
                        ? "bg-blue-50 border-blue-200 text-gray-950"
                        : "bg-white dark:bg-gray-950 dark:border-gray-800 dark:text-white text-gray-950";
                    return (
                      <div
                        key={day.dateKey}
                        className={`min-h-12 border rounded-sm p-1 text-left text-[11px] ${className}`}
                        title={saved?.title || day.dateKey}
                      >
                        <span className="font-bold">{day.dayNumber}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <section className="bg-white dark:bg-gray-900 rounded-sm shadow overflow-hidden">
          <div className="p-4 border-b dark:border-gray-800">
            <h2 className="font-semibold dark:text-white">
              Official Calendar List
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Official company calendar items for the selected year, including holidays, optional leaves, and working Saturdays.
            </p>
          </div>
          <div className="overflow-y-auto">
            {hrLeaveItems.length === 0 ? (
              <p className="p-4 text-sm text-gray-500 dark:text-gray-400">
                No HR leave items added yet.
              </p>
            ) : (
              hrLeaveItems.map((item) => (
                <div
                  key={item._id || item.dateKey}
                  className="border-b dark:border-gray-800 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-sm dark:text-white">
                        {item.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {item.dateKey}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-sm bg-[#fff5f3] text-[#f84525] capitalize">
                      {item.type.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                    {item.description || "No description"}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default EmployeeLeaveCalendar;
