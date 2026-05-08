import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { hrApi } from "../../api";
import Button from "../../components/common/Button";
import CommonLoader from "../../components/common/CommonLoader";
import { AuthContext } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";

const todayKey = () => new Date().toISOString().slice(0, 10);

const emptyTask = {
  assignedTo: "",
  taskDate: todayKey(),
  handledBy: "",
  phase: "",
  project: "",
  title: "",
  url: "",
  description: "",
  tech: "",
  timing: "",
  collaborator: "",
  status: "pending",
  reply: "",
  billing: "",
  priority: "normal",
  taskSource: "",
  remark: "",
};

const TaskManagement = () => {
  const toast = useToast();
  const { user } = useContext(AuthContext);
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState(emptyTask);
  const [date, setDate] = useState(todayKey());
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [employeeRes, taskRes] = await Promise.all([
        hrApi.getEmployees(),
        hrApi.getTasks({
          date,
          employeeId: employeeFilter || undefined,
        }),
      ]);
      setEmployees(employeeRes.data.data || []);
      setTasks(taskRes.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to load tasks");
    } finally {
      setLoading(false);
    }
  }, [date, employeeFilter, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stats = useMemo(
    () => ({
      total: tasks.length,
      pending: tasks.filter((task) => task.status === "pending").length,
      progress: tasks.filter((task) => task.status === "in_progress").length,
      completed: tasks.filter((task) => task.status === "completed").length,
    }),
    [tasks]
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setEditingId("");
    setForm({ ...emptyTask, taskDate: date });
  };

  const submitTask = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await hrApi.updateTask(editingId, form);
        toast.success("Task updated");
      } else {
        await hrApi.createTask(form);
        toast.success("Task assigned");
      }
      resetForm();
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to save task");
    } finally {
      setSaving(false);
    }
  };

  const editTask = (task) => {
    setEditingId(task._id);
    setForm({
      assignedTo: task.assignedTo?._id || "",
      taskDate: task.taskDate ? task.taskDate.slice(0, 10) : todayKey(),
      handledBy: task.handledBy || "",
      phase: task.phase || "",
      project: task.project || "",
      title: task.title || "",
      url: task.url || "",
      description: task.description || "",
      tech: task.tech || "",
      timing: task.timing || "",
      collaborator: task.collaborator || "",
      status: task.status || "pending",
      reply: task.reply || "",
      billing: task.billing || "",
      priority: task.priority || "normal",
      taskSource: task.taskSource || "",
      remark: task.remark || "",
    });
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await hrApi.deleteTask(taskId);
      toast.success("Task deleted");
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to delete task");
    }
  };

  if (loading) return <CommonLoader text="Loading tasks..." />;

  return (
    <div className="space-y-5">
      <section className="bg-white rounded-sm shadow p-4">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Task Management</h1>
            <p className="text-sm text-gray-500 mt-1">
              {user?.role === "teamlead" ? "Assign and track your team tasks." : "Assign and track employee tasks."}
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              ["Total", stats.total],
              ["Pending", stats.pending],
              ["Running", stats.progress],
              ["Done", stats.completed],
            ].map(([label, value]) => (
              <div key={label} className="px-3 py-2 rounded-sm bg-[#fff5f3] text-[#f84525] text-sm font-semibold">
                <span className="block text-xs">{label}</span>
                <span>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <form onSubmit={submitTask} className="bg-white rounded-sm shadow p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <label className="text-sm font-medium text-gray-700">
          Employee
          <select name="assignedTo" value={form.assignedTo} onChange={handleChange} className="mt-1 w-full border rounded-sm px-3 py-2" required>
            <option value="">Select employee</option>
            {employees.map((employee) => (
              <option key={employee._id} value={employee._id}>
                {employee.employeeId || "-"} - {employee.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-gray-700">
          Date
          <input type="date" name="taskDate" value={form.taskDate} onChange={handleChange} className="mt-1 w-full border rounded-sm px-3 py-2" required />
        </label>
        <label className="text-sm font-medium text-gray-700">
          Task Title
          <input name="title" value={form.title} onChange={handleChange} className="mt-1 w-full border rounded-sm px-3 py-2" required />
        </label>
        <label className="text-sm font-medium text-gray-700">
          Project
          <input name="project" value={form.project} onChange={handleChange} className="mt-1 w-full border rounded-sm px-3 py-2" />
        </label>

        {[
          ["handledBy", "Task Handle By"],
          ["phase", "Phase"],
          ["url", "URL"],
          ["tech", "Task Tech"],
          ["timing", "Task Timing"],
          ["collaborator", "Collaborator"],
          ["reply", "Reply"],
          ["billing", "Billing"],
          ["taskSource", "Task Source"],
          ["remark", "Remark"],
        ].map(([name, label]) => (
          <label key={name} className="text-sm font-medium text-gray-700">
            {label}
            <input name={name} value={form[name]} onChange={handleChange} className="mt-1 w-full border rounded-sm px-3 py-2" />
          </label>
        ))}

        <label className="text-sm font-medium text-gray-700">
          Status
          <select name="status" value={form.status} onChange={handleChange} className="mt-1 w-full border rounded-sm px-3 py-2">
            <option value="pending">Pending</option>
            <option value="in_progress">On Process</option>
            <option value="completed">Complete</option>
            <option value="blocked">Blocked</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
        <label className="text-sm font-medium text-gray-700">
          Priority
          <select name="priority" value={form.priority} onChange={handleChange} className="mt-1 w-full border rounded-sm px-3 py-2">
            <option value="normal">Normal</option>
            <option value="important">Important</option>
            <option value="urgent">Urgent</option>
            <option value="low">Low</option>
          </select>
        </label>
        <label className="text-sm font-medium text-gray-700 md:col-span-2">
          Task Description
          <textarea name="description" value={form.description} onChange={handleChange} className="mt-1 w-full border rounded-sm px-3 py-2 min-h-[42px]" />
        </label>

        <div className="md:col-span-4 flex gap-2">
          <Button text={editingId ? "Update Task" : "Assign Task"} loading={saving} type="submit" />
          {editingId && <Button text="Cancel Edit" variant="secondary" type="button" onClick={resetForm} />}
        </div>
      </form>

      <section className="bg-white rounded-sm shadow overflow-hidden">
        <div className="p-4 border-b bg-gray-50 grid grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)] gap-3">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border rounded-sm px-3 py-2" />
          <select value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)} className="border rounded-sm px-3 py-2">
            <option value="">All employees</option>
            {employees.map((employee) => (
              <option key={employee._id} value={employee._id}>
                {employee.employeeId || "-"} - {employee.name}
              </option>
            ))}
          </select>
        </div>

        {tasks.length === 0 ? (
          <p className="p-6 text-center text-gray-500">No tasks found for selected date.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1400px] w-full text-sm">
              <thead className="bg-gray-100 text-xs uppercase text-gray-600">
                <tr>
                  {["Employee", "Phase", "Project", "Task Title", "URL", "Description", "Tech", "Timing", "Collaborator", "Status", "Reply", "Billing", "Priority", "Source", "Remark", "Actions"].map((item) => (
                    <th key={item} className="px-3 py-3 text-left">{item}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task._id} className="border-t align-top">
                    <td className="px-3 py-3 min-w-[150px]">{task.assignedTo?.name || "-"}</td>
                    <td className="px-3 py-3">{task.phase || "-"}</td>
                    <td className="px-3 py-3">{task.project || "-"}</td>
                    <td className="px-3 py-3 font-medium max-w-[180px] break-words">{task.title}</td>
                    <td className="px-3 py-3 max-w-[180px] break-all">{task.url ? <a href={task.url} target="_blank" rel="noreferrer" className="text-[#f84525] underline">Open</a> : "-"}</td>
                    <td className="px-3 py-3 max-w-[240px] break-words">{task.description || "-"}</td>
                    <td className="px-3 py-3">{task.tech || "-"}</td>
                    <td className="px-3 py-3">{task.timing || "-"}</td>
                    <td className="px-3 py-3">{task.collaborator || "-"}</td>
                    <td className="px-3 py-3 capitalize">{task.status?.replace(/_/g, " ")}</td>
                    <td className="px-3 py-3 max-w-[180px] break-words">{task.reply || "-"}</td>
                    <td className="px-3 py-3">{task.billing || "-"}</td>
                    <td className="px-3 py-3 capitalize">{task.priority}</td>
                    <td className="px-3 py-3">{task.taskSource || "-"}</td>
                    <td className="px-3 py-3 max-w-[180px] break-words">{task.remark || "-"}</td>
                    <td className="px-3 py-3">
                      <div className="flex gap-2">
                        <Button text="Edit" className="text-xs px-3 py-1.5" onClick={() => editTask(task)} />
                        <Button text="Delete" variant="danger" className="text-xs px-3 py-1.5" onClick={() => deleteTask(task._id)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default TaskManagement;
