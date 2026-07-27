import { useCallback, useMemo, useEffect, useState } from "react";
import { employeeApi } from "../../api";
import Button from "../../components/common/Button";
import CommonLoader from "../../components/common/CommonLoader";
import { useToast } from "../../contexts/ToastContext";

const todayKey = () => new Date().toISOString().slice(0, 10);
const monthKey = () => new Date().toISOString().slice(0, 7);
const formatDate = (value) => (value ? new Date(value).toLocaleDateString() : "-");
const getExternalUrl = (value) => {
  const url = String(value || "").trim();
  if (!url) return "";
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(url) ? url : `https://${url}`;
};

const statusLabels = {
  pending: "Pending",
  in_progress: "On Process",
  completed: "Complete",
  blocked: "Blocked",
  cancelled: "Cancelled",
};

const EmployeeTasks = () => {
  const toast = useToast();
  const [tasks, setTasks] = useState([]);
  const [viewMode, setViewMode] = useState("date");
  const [date, setDate] = useState(todayKey());
  const [month, setMonth] = useState(monthKey());
  const [status, setStatus] = useState("");
  const [project, setProject] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await employeeApi.getTasks({
        date: viewMode === "date" ? date : undefined,
        month: viewMode === "month" ? month : undefined,
        status: status || undefined,
        project: project || undefined,
        search: search.trim() || undefined,
      });
      setTasks(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to load tasks");
    } finally {
      setLoading(false);
    }
  }, [date, month, project, search, status, toast, viewMode]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const updateTask = async (taskId, payload) => {
    setSavingId(taskId);
    try {
      await employeeApi.updateTask(taskId, payload);
      toast.success("Task updated");
      await loadTasks();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to update task");
    } finally {
      setSavingId("");
    }
  };

  const handleInline = (taskId, field, value) => {
    setTasks((current) =>
      current.map((task) => (task._id === taskId ? { ...task, [field]: value } : task))
    );
  };

  const projects = useMemo(
    () => [...new Set(tasks.map((task) => task.project).filter(Boolean))].sort(),
    [tasks]
  );

  const stats = useMemo(
    () => ({
      total: tasks.length,
      pending: tasks.filter((task) => task.status === "pending").length,
      running: tasks.filter((task) => task.status === "in_progress").length,
      completed: tasks.filter((task) => task.status === "completed").length,
    }),
    [tasks]
  );

  if (loading) return <CommonLoader text="Loading your tasks..." />;

  return (
    <div className="space-y-5">
      <section className="bg-white rounded-sm shadow p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">My Tasks</h1>
            <p className="text-sm text-gray-500 mt-1">View and update tasks assigned to you.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            <select value={viewMode} onChange={(e) => setViewMode(e.target.value)} className="border rounded-sm px-3 py-2">
              <option value="date">Date</option>
              <option value="month">Month</option>
              <option value="all">All</option>
            </select>
            {viewMode === "date" && (
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border rounded-sm px-3 py-2" />
            )}
            {viewMode === "month" && (
              <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="border rounded-sm px-3 py-2" />
            )}
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="border rounded-sm px-3 py-2">
              <option value="">All status</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <select value={project} onChange={(e) => setProject(e.target.value)} className="border rounded-sm px-3 py-2">
              <option value="">All projects</option>
              {projects.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search task, tech, reply" className="border rounded-sm px-3 py-2" />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            ["Total", stats.total],
            ["Pending", stats.pending],
            ["On Process", stats.running],
            ["Complete", stats.completed],
          ].map(([label, value]) => (
            <div key={label} className="rounded-sm border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
              <span className="block text-xs text-gray-500">{label}</span>
              <span className="font-semibold text-gray-900">{value}</span>
            </div>
          ))}
        </div>
      </section>

      {tasks.length === 0 ? (
        <section className="bg-white rounded-sm shadow p-8 text-center text-gray-500">
          No tasks found for selected filters.
        </section>
      ) : (
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {tasks.map((task) => {
            const important = ["important", "urgent"].includes(task.priority);
            return (
            <article key={task._id} className={`bg-white rounded-sm shadow p-4 space-y-3 border ${important ? "border-red-300 bg-red-50/60" : "border-transparent"}`}>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div>
                  <p className="text-xs text-gray-500">{formatDate(task.taskDate)} | {task.project || "No Project"} | {task.phase || "No Phase"}</p>
                  <h2 className="font-semibold text-gray-900 mt-1">{task.title}</h2>
                </div>
                <span className={`text-xs font-semibold capitalize px-2 py-1 rounded-sm ${important ? "bg-red-600 text-white" : "bg-[#fff5f3] text-[#f84525]"}`}>
                  {task.priority}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                <p><b>Tech:</b> {task.tech || "-"}</p>
                <p><b>Time:</b> {task.timing || "-"}</p>
                <p><b>Collaborator:</b> {task.collaborator || "-"}</p>
                <p><b>Source:</b> {task.taskSource || "-"}</p>
              </div>

              {task.url && (
                <a href={getExternalUrl(task.url)} target="_blank" rel="noreferrer" className="text-sm text-[#f84525] underline break-all">
                  {task.url}
                </a>
              )}

              <p className="text-sm text-gray-700 break-words">{task.description || "-"}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="text-sm font-medium text-gray-700">
                  Status
                  <select
                    value={task.status}
                    onChange={(e) => handleInline(task._id, "status", e.target.value)}
                    className="mt-1 w-full border rounded-sm px-3 py-2"
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">On Process</option>
                    <option value="completed">Complete</option>
                    <option value="blocked">Blocked</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </label>
                <label className="text-sm font-medium text-gray-700">
                  Time
                  <input
                    type="time"
                    value={task.timing || ""}
                    onChange={(e) => handleInline(task._id, "timing", e.target.value)}
                    className="mt-1 w-full border rounded-sm px-3 py-2"
                  />
                </label>
                <label className="text-sm font-medium text-gray-700">
                  Reply
                  <textarea
                    value={task.reply || ""}
                    onChange={(e) => handleInline(task._id, "reply", e.target.value)}
                    className="mt-1 w-full border rounded-sm px-3 py-2 min-h-[78px]"
                  />
                </label>
                <label className="text-sm font-medium text-gray-700">
                  Remark
                  <textarea
                    value={task.remark || ""}
                    onChange={(e) => handleInline(task._id, "remark", e.target.value)}
                    className="mt-1 w-full border rounded-sm px-3 py-2 min-h-[78px]"
                  />
                </label>
              </div>

              <Button
                text="Update Task"
                loading={savingId === task._id}
                onClick={() =>
                  updateTask(task._id, {
                    status: task.status,
                    timing: task.timing,
                    reply: task.reply,
                    remark: task.remark,
                  })
                }
              />
            </article>
            );
          })}
        </section>
      )}
    </div>
  );
};

export default EmployeeTasks;
