import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { hrApi } from "../../api";
import Button from "../../components/common/Button";
import CommonLoader from "../../components/common/CommonLoader";
import { AuthContext } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";

const todayKey = () => new Date().toISOString().slice(0, 10);
const monthKey = () => new Date().toISOString().slice(0, 7);

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
  collaborator: "",
  status: "pending",
  reply: "",
  billing: "",
  priority: "normal",
  taskSource: "",
  remark: "",
};

const statusLabels = {
  pending: "Pending",
  in_progress: "On Process",
  completed: "Complete",
  blocked: "Blocked",
  cancelled: "Cancelled",
};

const fieldOptions = {
  phase: ["Discuss", "Development", "Designing", "Testing", "Deployment", "Support"],
  tech: ["WFCS", "React", "Node", "MongoDB", "UI", "API", "SEO"],
  billing: ["Billable", "Non Billable", "Internal"],
  priority: ["normal", "important", "urgent", "low"],
  status: ["pending", "in_progress", "completed", "blocked", "cancelled"],
  taskSource: ["Client", "Mike Task", "Internal", "Asana", "WhatsApp", "Call"],
};

const getUnique = (tasks, key) =>
  [...new Set(tasks.map((task) => task[key]).filter(Boolean))].sort((a, b) =>
    String(a).localeCompare(String(b))
  );

const TaskManagement = () => {
  const toast = useToast();
  const { user } = useContext(AuthContext);
  const isHr = user?.role === "hr";
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState(emptyTask);
  const [date, setDate] = useState(todayKey());
  const [month, setMonth] = useState(monthKey());
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = isHr
        ? { month, employeeId: employeeFilter || undefined }
        : { date, employeeId: employeeFilter || undefined };
      const [employeeRes, taskRes] = await Promise.all([
        hrApi.getEmployees(),
        hrApi.getTasks(params),
      ]);
      setEmployees(employeeRes.data.data || []);
      setTasks(taskRes.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to load tasks");
    } finally {
      setLoading(false);
    }
  }, [date, employeeFilter, isHr, month, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const dynamicOptions = useMemo(
    () => ({
      project: getUnique(tasks, "project"),
      title: getUnique(tasks, "title"),
      url: getUnique(tasks, "url"),
      collaborator: getUnique(tasks, "collaborator"),
      handledBy: employees.map((employee) => employee.name).filter(Boolean),
    }),
    [employees, tasks]
  );

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

  const downloadMonthlySheet = () => {
    const rows = tasks.map((task, index) => ({
      "S.NO": index + 1,
      "TASK HANDLE BY": task.handledBy || task.assignedTo?.name || "",
      PHASES: task.phase || "",
      PROJECT: task.project || "",
      "TASK TITLE": task.title || "",
      URL: task.url || "",
      "TASK DESCRIPTION": task.description || "",
      "TASK TECH": task.tech || "",
      "TASK TIMING": task.timing || "",
      "TASK COLLABORATOR": task.collaborator || "",
      STATUS: statusLabels[task.status] || task.status || "",
      REPLY: task.reply || "",
      BILLING: task.billing || "",
      PRIORITY: task.priority || "",
      "HANDLED BY": task.assignedTo?.name || "",
      "TASK SOURCE": task.taskSource || "",
      REMARK: task.remark || "",
    }));
    const sheet = XLSX.utils.json_to_sheet(rows);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Monthly Tasks");
    XLSX.writeFile(book, `task-sheet-${month}.xlsx`);
  };

  const TextWithList = ({ name, label, options = [] }) => (
    <label className="text-sm font-medium text-gray-700">
      {label}
      <input
        name={name}
        value={form[name]}
        onChange={handleChange}
        list={`${name}-options`}
        className="mt-1 w-full border rounded-sm px-3 py-2"
      />
      <datalist id={`${name}-options`}>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </label>
  );

  if (loading) return <CommonLoader text="Loading tasks..." />;

  return (
    <div className="space-y-5">
      <section className="bg-white rounded-sm shadow p-4">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {isHr ? "Monthly Task Sheet" : "Team Task Management"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {isHr
                ? "Review monthly task data and download Excel sheet."
                : "Add project/task details for your assigned team. Employees update timing and replies."}
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

      {!isHr && (
        <form onSubmit={submitTask} className="bg-white rounded-sm shadow p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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
            <TextWithList name="project" label="Project" options={dynamicOptions.project} />
            <TextWithList name="title" label="Task Title" options={dynamicOptions.title} />
            <TextWithList name="url" label="URL" options={dynamicOptions.url} />
            <TextWithList name="handledBy" label="Task Handle By" options={dynamicOptions.handledBy} />
            <label className="text-sm font-medium text-gray-700">
              Phase
              <select name="phase" value={form.phase} onChange={handleChange} className="mt-1 w-full border rounded-sm px-3 py-2">
                <option value="">Select phase</option>
                {fieldOptions.phase.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-gray-700">
              Task Tech
              <select name="tech" value={form.tech} onChange={handleChange} className="mt-1 w-full border rounded-sm px-3 py-2">
                <option value="">Select tech</option>
                {fieldOptions.tech.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
            <TextWithList name="collaborator" label="Collaborator" options={dynamicOptions.collaborator} />
            <label className="text-sm font-medium text-gray-700">
              Billing
              <select name="billing" value={form.billing} onChange={handleChange} className="mt-1 w-full border rounded-sm px-3 py-2">
                <option value="">Select billing</option>
                {fieldOptions.billing.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-gray-700">
              Priority
              <select name="priority" value={form.priority} onChange={handleChange} className="mt-1 w-full border rounded-sm px-3 py-2">
                {fieldOptions.priority.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-gray-700">
              Task Source
              <select name="taskSource" value={form.taskSource} onChange={handleChange} className="mt-1 w-full border rounded-sm px-3 py-2">
                <option value="">Select source</option>
                {fieldOptions.taskSource.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium text-gray-700">
              Status
              <select name="status" value={form.status} onChange={handleChange} className="mt-1 w-full border rounded-sm px-3 py-2">
                {fieldOptions.status.map((option) => <option key={option} value={option}>{statusLabels[option]}</option>)}
              </select>
            </label>
          </div>
          <label className="block text-sm font-medium text-gray-700">
            Task Description
            <textarea name="description" value={form.description} onChange={handleChange} className="mt-1 w-full border rounded-sm px-3 py-2 min-h-[80px]" />
          </label>
          <div className="flex gap-2">
            <Button text={editingId ? "Update Task" : "Add Task"} loading={saving} type="submit" />
            {editingId && <Button text="Cancel Edit" variant="secondary" type="button" onClick={resetForm} />}
          </div>
        </form>
      )}

      <section className="bg-white rounded-sm shadow overflow-hidden">
        <div className="p-4 border-b bg-gray-50 grid grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)_auto] gap-3">
          {isHr ? (
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="border rounded-sm px-3 py-2" />
          ) : (
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border rounded-sm px-3 py-2" />
          )}
          <select value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)} className="border rounded-sm px-3 py-2">
            <option value="">All employees</option>
            {employees.map((employee) => (
              <option key={employee._id} value={employee._id}>
                {employee.employeeId || "-"} - {employee.name}
              </option>
            ))}
          </select>
          {isHr && <Button text="Download Excel" onClick={downloadMonthlySheet} disabled={tasks.length === 0} />}
        </div>

        {tasks.length === 0 ? (
          <p className="p-6 text-center text-gray-500">No tasks found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1500px] w-full text-sm">
              <thead className="bg-gray-100 text-xs uppercase text-gray-600">
                <tr>
                  {["Employee", "Phase", "Project", "Task Title", "URL", "Description", "Tech", "Timing", "Collaborator", "Status", "Reply", "Billing", "Priority", "Source", "Remark", ...(!isHr ? ["Actions"] : [])].map((item) => (
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
                    <td className="px-3 py-3">{task.url ? <a href={task.url} target="_blank" rel="noreferrer" className="text-[#f84525] underline">Open</a> : "-"}</td>
                    <td className="px-3 py-3 max-w-[260px] break-words">{task.description || "-"}</td>
                    <td className="px-3 py-3">{task.tech || "-"}</td>
                    <td className="px-3 py-3">{task.timing || "-"}</td>
                    <td className="px-3 py-3">{task.collaborator || "-"}</td>
                    <td className="px-3 py-3">{statusLabels[task.status] || task.status}</td>
                    <td className="px-3 py-3 max-w-[180px] break-words">{task.reply || "-"}</td>
                    <td className="px-3 py-3">{task.billing || "-"}</td>
                    <td className="px-3 py-3 capitalize">{task.priority}</td>
                    <td className="px-3 py-3">{task.taskSource || "-"}</td>
                    <td className="px-3 py-3 max-w-[180px] break-words">{task.remark || "-"}</td>
                    {!isHr && (
                      <td className="px-3 py-3">
                        <div className="flex gap-2">
                          <Button text="Edit" className="text-xs px-3 py-1.5" onClick={() => editTask(task)} />
                          <Button text="Delete" variant="danger" className="text-xs px-3 py-1.5" onClick={() => deleteTask(task._id)} />
                        </div>
                      </td>
                    )}
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
