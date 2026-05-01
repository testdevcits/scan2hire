import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi, hrApi } from "../../api";
import Button from "../../components/common/Button";
import CommonLoader from "../../components/common/CommonLoader";
import { useToast } from "../../contexts/ToastContext";

const AdminDashboard = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [hrs, setHrs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    setPageLoading(true);
    try {
      const [hrRes, employeeRes, candidateRes, attendanceRes, leavesRes] =
        await Promise.all([
          authApi.getHrs(),
          hrApi.getEmployees(),
          hrApi.getCandidates(),
          hrApi.getAttendance(new Date().toISOString().slice(0, 7)),
          hrApi.getLeaves(),
        ]);

      setHrs(hrRes.data.data || []);
      setEmployees(employeeRes.data.data || []);
      setCandidates(candidateRes.data.data || []);
      setAttendance(attendanceRes.data.data || []);
      setLeaves(leavesRes.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to load dashboard data");
    } finally {
      setPageLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const candidateChart = useMemo(() => {
    const total = Math.max(candidates.length, 1);
    return [
      ["First Round", candidates.filter((item) => item.interviewStatus === "first_round").length],
      ["Selected", candidates.filter((item) => item.interviewStatus === "selected").length],
      ["Rejected", candidates.filter((item) => item.interviewStatus === "rejected").length],
    ].map(([label, value]) => ({ label, value, width: `${(value / total) * 100}%` }));
  }, [candidates]);

  const attendanceSummary = useMemo(() => {
    return [
      ["Present", attendance.filter((item) => item.status === "present").length],
      ["Half Day", attendance.filter((item) => item.status === "half_day").length],
      ["Running", attendance.filter((item) => item.status === "running").length],
    ];
  }, [attendance]);

  if (pageLoading) return <CommonLoader text="Loading dashboard..." />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
        <p className="text-sm text-gray-500">
          Live overview for HR, employees, candidates, attendance, and leave activity.
        </p>
      </div>

      <section className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          ["HR", hrs.length],
          ["Employees", employees.length],
          ["Candidates", candidates.length],
          ["Attendance", attendance.length],
          ["Leaves", leaves.length],
        ].map(([label, value]) => (
          <div key={label} className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="text-3xl font-bold text-[#f84525] mt-1">{value}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Candidate Pipeline</h2>
            <Button text="Open" onClick={() => navigate("/admin/candidates")} />
          </div>
          <div className="space-y-3">
            {candidateChart.map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{item.label}</span>
                  <span>{item.value}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#f84525]" style={{ width: item.width }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">This Month Attendance</h2>
            <Button text="Reports" onClick={() => navigate("/admin/reports")} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {attendanceSummary.map(([label, value]) => (
              <div key={label} className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold">Recent HR Accounts</h2>
          <span className="text-sm bg-[#fff5f3] text-[#f84525] px-3 py-1 rounded-md">
            {hrs.length} HR
          </span>
        </div>
        {hrs.length === 0 ? (
          <p className="p-4 text-center text-gray-500">No HR users found</p>
        ) : (
          hrs.slice(0, 5).map((hr) => (
            <div key={hr._id} className="grid grid-cols-1 md:grid-cols-4 gap-2 border-t px-4 py-3 text-sm md:items-center">
              <span>{hr.name}</span>
              <span className="break-all">{hr.email}</span>
              <span>{hr.mobile}</span>
              <span className={hr.isActive ? "text-green-600 font-medium" : "text-gray-500"}>
                {hr.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          ))
        )}
      </section>
    </div>
  );
};

export default AdminDashboard;
