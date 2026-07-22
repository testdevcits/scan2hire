import { useCallback, useEffect, useMemo, useState } from "react";
import { FiEye, FiRefreshCw } from "react-icons/fi";
import { hrApi } from "../../api";
import CommonLoader from "../../components/common/CommonLoader";
import FilePreviewModal from "../../components/common/FilePreviewModal";
import { useToast } from "../../contexts/ToastContext";

const getDateKey = (date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

const formatTime = (value) =>
  value
    ? new Date(value).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

const minutesToHours = (minutes = 0) => `${Math.floor(minutes / 60)}h ${minutes % 60}m`;

const TodayCheckIns = () => {
  const toast = useToast();
  const todayKey = getDateKey();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);

  const loadCheckIns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await hrApi.getAttendance(todayKey.slice(0, 7));
      setAttendance(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to load today's check-ins");
    } finally {
      setLoading(false);
    }
  }, [todayKey, toast]);

  useEffect(() => {
    loadCheckIns();
  }, [loadCheckIns]);

  const todayCheckIns = useMemo(
    () =>
      attendance
        .filter((item) => item.dateKey === todayKey && item.loginAt)
        .sort((a, b) => new Date(b.loginAt) - new Date(a.loginAt)),
    [attendance, todayKey]
  );

  if (loading) return <CommonLoader text="Loading today's check-ins..." />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Today Check-ins</h1>
          <p className="text-sm text-gray-500">
            Employees who checked in today from app or desktop. App check-ins include selfie proof.
          </p>
        </div>
        <button
          type="button"
          onClick={loadCheckIns}
          className="inline-flex items-center justify-center gap-2 border rounded-sm px-3 py-2 text-sm"
        >
          <FiRefreshCw />
          Refresh
        </button>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-sm shadow p-4">
          <p className="text-sm text-gray-500">Date</p>
          <p className="text-xl font-semibold">{todayKey}</p>
        </div>
        <div className="bg-white rounded-sm shadow p-4">
          <p className="text-sm text-gray-500">Checked In</p>
          <p className="text-xl font-semibold">{todayCheckIns.length}</p>
        </div>
        <div className="bg-white rounded-sm shadow p-4">
          <p className="text-sm text-gray-500">Running</p>
          <p className="text-xl font-semibold">
            {todayCheckIns.filter((item) => item.status === "running").length}
          </p>
        </div>
        <div className="bg-white rounded-sm shadow p-4">
          <p className="text-sm text-gray-500">With Selfie</p>
          <p className="text-xl font-semibold">
            {todayCheckIns.filter((item) => item.loginSelfie?.url).length}
          </p>
        </div>
      </section>

      <section className="bg-white rounded-sm shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3">Employee</th>
                <th className="text-left px-4 py-3">Selfie</th>
                <th className="text-left px-4 py-3">Login</th>
                <th className="text-left px-4 py-3">Logout</th>
                <th className="text-left px-4 py-3">Mode</th>
                <th className="text-left px-4 py-3">Distance</th>
                <th className="text-left px-4 py-3">Work</th>
                <th className="text-left px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {todayCheckIns.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                    No check-ins found for today.
                  </td>
                </tr>
              ) : (
                todayCheckIns.map((item) => (
                  <tr key={item._id} className="border-t">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-900">{item.employee?.name || "N/A"}</p>
                      <p className="text-xs text-gray-500">
                        {item.employee?.employeeId || "-"} • {item.employee?.department || "-"}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {item.loginSelfie?.url ? (
                        <button
                          type="button"
                          onClick={() =>
                            setPreview({
                              title: `${item.employee?.name || "Employee"} check-in selfie`,
                              url: item.loginSelfie.url,
                            })
                          }
                          className="flex items-center gap-2 text-[#f84525]"
                        >
                          <img
                            src={item.loginSelfie.url}
                            alt="Check-in selfie"
                            className="w-10 h-10 object-cover rounded-sm border"
                          />
                          <FiEye />
                        </button>
                      ) : (
                        <span className="text-gray-400">No selfie</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{formatTime(item.loginAt)}</td>
                    <td className="px-4 py-3">{formatTime(item.logoutAt)}</td>
                    <td className="px-4 py-3">
                      {item.attendanceMode === "work_from_home" ? "WFH" : "Office"}
                    </td>
                    <td className="px-4 py-3">
                      {Number.isFinite(item.loginLocation?.distanceFromOfficeMeters) ? (
                        <div>
                          <p
                            className={
                              item.loginLocation?.withinRadius === false
                                ? "font-semibold text-red-600"
                                : "font-medium text-gray-900"
                            }
                          >
                            {item.loginLocation.distanceFromOfficeMeters}m
                          </p>
                          <p className="text-xs text-gray-500">
                            Radius {item.loginLocation?.radiusMeters || "-"}m
                          </p>
                          {item.loginLocation?.withinRadius === false && (
                            <span className="mt-1 inline-block rounded-sm bg-red-50 px-2 py-0.5 text-xs text-red-700">
                              Outside
                            </span>
                          )}
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3">{minutesToHours(item.totalWorkMinutes || 0)}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-sm bg-gray-100 text-gray-700 text-xs">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {preview && (
        <FilePreviewModal
          title={preview.title}
          url={preview.url}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
};

export default TodayCheckIns;
