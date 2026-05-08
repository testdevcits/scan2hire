import { useCallback, useEffect, useState } from "react";
import { employeeApi } from "../../api";
import Button from "../../components/common/Button";
import CommonLoader from "../../components/common/CommonLoader";
import { useToast } from "../../contexts/ToastContext";

const todayKey = () => new Date().toISOString().slice(0, 10);

const EmployeeTasks = () => {
  const toast = useToast();
  const [tasks, setTasks] = useState([]);
  const [date, setDate] = useState(todayKey());
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await employeeApi.getTasks({
        date,
        status: status || undefined,
      });
      setTasks(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to load tasks");
    } finally {
      setLoading(false);
    }
  }, [date, status, toast]);

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

  if (loading) return <CommonLoader text="Loading your tasks..." />;

  return (
    <div className="space-y-5">
      <section className="bg-white rounded-sm shadow p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">My Tasks</h1>
            <p className="text-sm text-gray-500 mt-1">View and update tasks assigned to you by date.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border rounded-sm px-3 py-2" />
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="border rounded-sm px-3 py-2">
              <option value="">All status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">On Process</option>
              <option value="completed">Complete</option>
              <option value="blocked">Blocked</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </section>

      {tasks.length === 0 ? (
        <section className="bg-white rounded-sm shadow p-8 text-center text-gray-500">
          No tasks found for selected date.
        </section>
      ) : (
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {tasks.map((task) => (
            <article key={task._id} className="bg-white rounded-sm shadow p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div>
                  <p className="text-xs text-gray-500">{task.project || "No Project"} | {task.phase || "No Phase"}</p>
                  <h2 className="font-semibold text-gray-900 mt-1">{task.title}</h2>
                </div>
                <span className="text-xs font-semibold capitalize bg-[#fff5f3] text-[#f84525] px-2 py-1 rounded-sm">
                  {task.priority}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                <p><b>Tech:</b> {task.tech || "-"}</p>
                <p><b>Timing:</b> {task.timing || "-"}</p>
                <p><b>Collaborator:</b> {task.collaborator || "-"}</p>
                <p><b>Source:</b> {task.taskSource || "-"}</p>
              </div>

              {task.url && (
                <a href={task.url} target="_blank" rel="noreferrer" className="text-sm text-[#f84525] underline break-all">
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
                  Timing
                  <input
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
          ))}
        </section>
      )}
    </div>
  );
};

export default EmployeeTasks;
