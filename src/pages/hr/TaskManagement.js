import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { hrApi } from "../../api";
import Button from "../../components/common/Button";
import CommonLoader from "../../components/common/CommonLoader";
import { AuthContext } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";

const todayKey = () => new Date().toISOString().slice(0, 10);
const monthKey = () => new Date().toISOString().slice(0, 7);
const getExternalUrl = (value) => {
  const url = String(value || "").trim();
  if (!url) return "";
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(url) ? url : `https://${url}`;
};
const fileToDataUri = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, dataUri: reader.result, resourceType: "image" });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const statusLabels = {
  pending: "Pending",
  in_progress: "On Process",
  completed: "Complete",
  blocked: "Blocked",
  cancelled: "Cancelled",
};

const projectDefaults = {
  name: "",
  phase: "Development",
  environment: "development",
  url: "",
  tech: "",
  billing: "",
  taskSource: "",
  description: "",
};

const taskDefaults = {
  assignedTo: "",
  taskDate: todayKey(),
  title: "",
  priority: "normal",
  status: "pending",
  timing: "",
  collaborator: "",
  remark: "",
  attachments: [],
};

const TaskManagement = () => {
  const toast = useToast();
  const { user } = useContext(AuthContext);
  const isHr = user?.role === "hr";
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectForm, setProjectForm] = useState(projectDefaults);
  const [editingProjectId, setEditingProjectId] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [taskForm, setTaskForm] = useState(taskDefaults);
  const [date, setDate] = useState(todayKey());
  const [month, setMonth] = useState(monthKey());
  const [taskViewMode, setTaskViewMode] = useState("date");
  const [projectFilter, setProjectFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [editingTaskId, setEditingTaskId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingTimeId, setSavingTimeId] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = isHr
        ? { month, employeeId: employeeFilter || undefined, project: projectFilter || undefined }
        : {
            date: taskViewMode === "date" ? date : undefined,
            month: taskViewMode === "month" ? month : undefined,
            employeeId: employeeFilter || undefined,
            project: projectFilter || undefined,
          };
      const requests = [hrApi.getEmployees(), hrApi.getTasks(params)];
      if (!isHr) requests.push(hrApi.getTaskProjects());
      const [employeeRes, taskRes, projectRes] = await Promise.all(requests);
      setEmployees(employeeRes.data.data || []);
      setTasks(taskRes.data.data || []);
      if (!isHr) setProjects(projectRes?.data?.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to load task data");
    } finally {
      setLoading(false);
    }
  }, [date, employeeFilter, isHr, month, projectFilter, taskViewMode, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedProject = useMemo(
    () => projects.find((project) => project._id === selectedProjectId),
    [projects, selectedProjectId]
  );

  useEffect(() => {
    if (!selectedProject) return;
    setTaskForm((prev) => ({
      ...prev,
      title: prev.title,
    }));
  }, [selectedProject]);

  const stats = useMemo(
    () => ({
      total: tasks.length,
      important: tasks.filter((task) => ["important", "urgent"].includes(task.priority)).length,
      running: tasks.filter((task) => task.status === "in_progress").length,
      completed: tasks.filter((task) => task.status === "completed").length,
    }),
    [tasks]
  );

  const saveProject = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = editingProjectId
        ? await hrApi.updateTaskProject(editingProjectId, projectForm)
        : await hrApi.createTaskProject(projectForm);
      toast.success(editingProjectId ? "Project updated" : "Project added");
      setProjectForm(projectDefaults);
      setEditingProjectId("");
      await loadData();
      setSelectedProjectId(res.data.data?._id || "");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to save project");
    } finally {
      setSaving(false);
    }
  };

  const editProject = (project) => {
    setEditingProjectId(project._id);
    setSelectedProjectId(project._id);
    setProjectForm({
      name: project.name || "",
      phase: project.phase || "Development",
      environment: project.environment || "development",
      url: project.url || "",
      tech: project.tech || "",
      billing: project.billing || "",
      taskSource: project.taskSource || "",
      description: project.description || "",
    });
  };

  const resetProjectForm = () => {
    setProjectForm(projectDefaults);
    setEditingProjectId("");
  };

  const saveTask = async (e) => {
    e.preventDefault();
    if (!selectedProject) {
      toast.error("Select project first");
      return;
    }

    const payload = {
      ...taskForm,
      project: selectedProject.name,
      phase: selectedProject.phase,
      url: selectedProject.url,
      tech: selectedProject.tech,
      billing: selectedProject.billing,
      taskSource: selectedProject.taskSource,
      description: selectedProject.description,
      handledBy: employees.find((employee) => employee._id === taskForm.assignedTo)?.name || "",
    };
    if (!payload.attachments?.length) {
      delete payload.attachments;
    }

    setSaving(true);
    try {
      if (editingTaskId) {
        await hrApi.updateTask(editingTaskId, payload);
        toast.success("Task updated");
      } else {
        await hrApi.createTask(payload);
        toast.success("Task assigned");
      }
      setTaskForm({ ...taskDefaults, taskDate: date });
      setEditingTaskId("");
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to save task");
    } finally {
      setSaving(false);
    }
  };

  const editTask = (task) => {
    const project = projects.find((item) => item.name === task.project);
    setSelectedProjectId(project?._id || "");
    setEditingTaskId(task._id);
    setTaskForm({
      assignedTo: task.assignedTo?._id || "",
      taskDate: task.taskDate ? task.taskDate.slice(0, 10) : todayKey(),
      title: task.title || "",
      priority: task.priority || "normal",
      status: task.status || "pending",
      timing: task.timing || "",
      collaborator: task.collaborator || "",
      remark: task.remark || "",
      attachments: [],
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

  const updateTaskTime = async (task) => {
    setSavingTimeId(task._id);
    try {
      await hrApi.updateTask(task._id, { timing: task.timing || "" });
      toast.success("Task time updated");
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to update time");
    } finally {
      setSavingTimeId("");
    }
  };

  const updateTaskInline = (taskId, field, value) => {
    setTasks((current) =>
      current.map((task) => (task._id === taskId ? { ...task, [field]: value } : task))
    );
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
      "TASK TIME": task.timing || "",
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
    const safeProject = projectFilter ? `-${projectFilter.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}` : "";
    XLSX.writeFile(book, `task-sheet-${month}${safeProject}.xlsx`);
  };

  if (loading) return <CommonLoader text="Loading tasks..." />;

  return (
    <div className="space-y-5">
      <section className="bg-white rounded-sm shadow p-4">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{isHr ? "Monthly Task Sheet" : "Team Task Management"}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {isHr ? "Download monthly task sheet." : "Add projects first, then assign sheet-style tasks to your team."}
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              ["Total", stats.total],
              ["Important", stats.important],
              ["Running", stats.running],
              ["Done", stats.completed],
            ].map(([label, value]) => (
              <div key={label} className={`px-3 py-2 rounded-sm text-sm font-semibold ${label === "Important" ? "bg-red-50 text-red-700 border border-red-200" : "bg-[#fff5f3] text-[#f84525]"}`}>
                <span className="block text-xs">{label}</span>
                <span>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {!isHr && (
        <section className="grid grid-cols-1 xl:grid-cols-[380px_minmax(0,1fr)] gap-4">
          <form onSubmit={saveProject} className="bg-white rounded-sm shadow p-4 space-y-3">
            <div>
              <h2 className="font-semibold text-gray-900">Project Master</h2>
              <p className="text-xs text-gray-500 mt-1">{editingProjectId ? "Project details update karo." : "Project information yaha add karo. Task row me project select hoga."}</p>
            </div>
            <label className="text-sm font-medium text-gray-700">
              Project Name
              <input value={projectForm.name} onChange={(e) => setProjectForm((prev) => ({ ...prev, name: e.target.value }))} className="mt-1 w-full border rounded-sm px-3 py-2" required />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-sm font-medium text-gray-700">
                Phase
                <select value={projectForm.phase} onChange={(e) => setProjectForm((prev) => ({ ...prev, phase: e.target.value }))} className="mt-1 w-full border rounded-sm px-3 py-2">
                  <option>Development</option>
                  <option>Designing</option>
                  <option>Testing</option>
                  <option>Discuss</option>
                  <option>Support</option>
                </select>
              </label>
              <label className="text-sm font-medium text-gray-700">
                Stage
                <select value={projectForm.environment} onChange={(e) => setProjectForm((prev) => ({ ...prev, environment: e.target.value }))} className="mt-1 w-full border rounded-sm px-3 py-2">
                  <option value="development">Development</option>
                  <option value="live">Live</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="testing">Testing</option>
                </select>
              </label>
            </div>
            <label className="text-sm font-medium text-gray-700">
              URL
              <input value={projectForm.url} onChange={(e) => setProjectForm((prev) => ({ ...prev, url: e.target.value }))} className="mt-1 w-full border rounded-sm px-3 py-2" />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-sm font-medium text-gray-700">
                Tech
                <input value={projectForm.tech} onChange={(e) => setProjectForm((prev) => ({ ...prev, tech: e.target.value }))} className="mt-1 w-full border rounded-sm px-3 py-2" />
              </label>
              <label className="text-sm font-medium text-gray-700">
                Billing
                <select value={projectForm.billing} onChange={(e) => setProjectForm((prev) => ({ ...prev, billing: e.target.value }))} className="mt-1 w-full border rounded-sm px-3 py-2">
                  <option value="">Select</option>
                  <option>Billable</option>
                  <option>Non Billable</option>
                  <option>Internal</option>
                </select>
              </label>
            </div>
            <label className="text-sm font-medium text-gray-700">
              Task Source
              <input value={projectForm.taskSource} onChange={(e) => setProjectForm((prev) => ({ ...prev, taskSource: e.target.value }))} className="mt-1 w-full border rounded-sm px-3 py-2" />
            </label>
            <label className="text-sm font-medium text-gray-700">
              Project Description
              <textarea value={projectForm.description} onChange={(e) => setProjectForm((prev) => ({ ...prev, description: e.target.value }))} className="mt-1 w-full border rounded-sm px-3 py-2 min-h-[78px]" />
            </label>
            <div className="flex gap-2">
              <Button text={editingProjectId ? "Update Project" : "Add Project"} type="submit" loading={saving} className="flex-1" />
              {editingProjectId && (
                <Button text="Cancel" variant="secondary" onClick={resetProjectForm} />
              )}
            </div>
            {projects.length > 0 && (
              <div className="border-t pt-3 space-y-2">
                <p className="text-xs font-semibold uppercase text-gray-500">Your Projects</p>
                <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                  {projects.map((project) => (
                    <button
                      key={project._id}
                      type="button"
                      onClick={() => editProject(project)}
                      className={`w-full text-left rounded-sm border px-3 py-2 text-sm hover:border-[#f84525] ${editingProjectId === project._id ? "border-[#f84525] bg-[#fff5f3]" : "border-gray-200 bg-white"}`}
                    >
                      <span className="block font-semibold text-gray-900">{project.name}</span>
                      <span className="block text-xs text-gray-500">{project.phase || "-"} | {project.environment || "-"}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>

          <div className="bg-white rounded-sm shadow overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b">
              <h2 className="font-semibold text-gray-900">Task Sheet Entry</h2>
              <p className="text-xs text-gray-500 mt-1">Project select karo, employee choose karo, task title aur priority set karo.</p>
            </div>
            <form onSubmit={saveTask} className="p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <label className="text-sm font-medium text-gray-700 md:col-span-2">
                  Project
                  <select value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)} className="mt-1 w-full border rounded-sm px-3 py-2" required>
                    <option value="">Select project</option>
                    {projects.map((project) => (
                      <option key={project._id} value={project._id}>
                        {project.name} - {project.phase} - {project.environment}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm font-medium text-gray-700">
                  Employee
                  <select value={taskForm.assignedTo} onChange={(e) => setTaskForm((prev) => ({ ...prev, assignedTo: e.target.value }))} className="mt-1 w-full border rounded-sm px-3 py-2" required>
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
                  <input type="date" value={taskForm.taskDate} onChange={(e) => setTaskForm((prev) => ({ ...prev, taskDate: e.target.value }))} className="mt-1 w-full border rounded-sm px-3 py-2" required />
                </label>
                <label className="text-sm font-medium text-gray-700 md:col-span-2">
                  Task Title
                  <input value={taskForm.title} onChange={(e) => setTaskForm((prev) => ({ ...prev, title: e.target.value }))} className="mt-1 w-full border rounded-sm px-3 py-2" required />
                </label>
                <label className="text-sm font-medium text-gray-700">
                  Priority
                  <select value={taskForm.priority} onChange={(e) => setTaskForm((prev) => ({ ...prev, priority: e.target.value }))} className={`mt-1 w-full border rounded-sm px-3 py-2 ${["important", "urgent"].includes(taskForm.priority) ? "border-red-400 bg-red-50 text-red-700 font-semibold" : ""}`}>
                    <option value="normal">Normal</option>
                    <option value="important">Important</option>
                    <option value="urgent">Urgent</option>
                    <option value="low">Low</option>
                  </select>
                </label>
                <label className="text-sm font-medium text-gray-700">
                  Status
                  <select value={taskForm.status} onChange={(e) => setTaskForm((prev) => ({ ...prev, status: e.target.value }))} className="mt-1 w-full border rounded-sm px-3 py-2">
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
                    value={taskForm.timing}
                    onChange={(e) => setTaskForm((prev) => ({ ...prev, timing: e.target.value }))}
                    className="mt-1 w-full border rounded-sm px-3 py-2"
                  />
                </label>
                <label className="text-sm font-medium text-gray-700 md:col-span-2">
                  Collaborator
                  <input value={taskForm.collaborator} onChange={(e) => setTaskForm((prev) => ({ ...prev, collaborator: e.target.value }))} className="mt-1 w-full border rounded-sm px-3 py-2" />
                </label>
                <label className="text-sm font-medium text-gray-700 md:col-span-2">
                  Remark
                  <input value={taskForm.remark} onChange={(e) => setTaskForm((prev) => ({ ...prev, remark: e.target.value }))} className="mt-1 w-full border rounded-sm px-3 py-2" />
                </label>
                <label className="text-sm font-medium text-gray-700 md:col-span-2">
                  Images
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={async (e) => {
                      const files = await Promise.all(Array.from(e.target.files || []).map(fileToDataUri));
                      setTaskForm((prev) => ({ ...prev, attachments: files }));
                    }}
                    className="mt-1 w-full border rounded-sm px-3 py-2"
                  />
                </label>
              </div>

              {selectedProject && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 rounded-sm border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
                  <span><b>Phase:</b> {selectedProject.phase || "-"}</span>
                  <span><b>Stage:</b> {selectedProject.environment || "-"}</span>
                  <span><b>Tech:</b> {selectedProject.tech || "-"}</span>
                  <span><b>Billing:</b> {selectedProject.billing || "-"}</span>
                  <span className="md:col-span-4 break-all"><b>URL:</b> {selectedProject.url || "-"}</span>
                </div>
              )}

              <div className="flex gap-2">
                <Button text={editingTaskId ? "Update Task" : "Add Task"} loading={saving} type="submit" />
                {editingTaskId && (
                  <Button
                    text="Cancel Edit"
                    variant="secondary"
                    onClick={() => {
                      setEditingTaskId("");
                      setTaskForm({ ...taskDefaults, taskDate: date });
                    }}
                  />
                )}
              </div>
            </form>
          </div>
        </section>
      )}

      <section className="bg-white rounded-sm shadow overflow-hidden">
        <div className={`p-4 border-b bg-gray-50 grid grid-cols-1 gap-3 ${isHr ? "md:grid-cols-[180px_minmax(0,1fr)_auto]" : "lg:grid-cols-[150px_180px_minmax(0,1fr)_minmax(0,1fr)_auto]"}`}>
          {!isHr && (
            <select value={taskViewMode} onChange={(e) => setTaskViewMode(e.target.value)} className="border rounded-sm px-3 py-2">
              <option value="date">Daily View</option>
              <option value="month">Monthly Sheet</option>
            </select>
          )}
          {isHr || taskViewMode === "month" ? (
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="border rounded-sm px-3 py-2" />
          ) : (
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border rounded-sm px-3 py-2" />
          )}
          {!isHr && (
            <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="border rounded-sm px-3 py-2">
              <option value="">All projects</option>
              {projects.map((project) => (
                <option key={project._id} value={project.name}>
                  {project.name}
                </option>
              ))}
            </select>
          )}
          <select value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)} className="border rounded-sm px-3 py-2">
            <option value="">All employees</option>
            {employees.map((employee) => (
              <option key={employee._id} value={employee._id}>
                {employee.employeeId || "-"} - {employee.name}
              </option>
            ))}
          </select>
          {(isHr || taskViewMode === "month") && (
            <Button
              text={isHr ? "Download Excel" : "Export Monthly Sheet"}
              onClick={downloadMonthlySheet}
              disabled={tasks.length === 0 || (!isHr && !projectFilter)}
            />
          )}
        </div>
        {!isHr && taskViewMode === "month" && !projectFilter && (
          <div className="border-b bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Select a project to export the full monthly sheet with employee time.
          </div>
        )}

        {tasks.length === 0 ? (
          <p className="p-6 text-center text-gray-500">No tasks found.</p>
        ) : isHr ? (
          <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
            {tasks.map((task) => {
              const important = ["important", "urgent"].includes(task.priority);
              const attachments = [...(task.attachments || []), ...(task.responseAttachments || [])];
              return (
                <article
                  key={task._id}
                  className={`rounded-sm border p-4 text-sm ${important ? "border-red-200 bg-red-50/70" : "border-gray-200 bg-white"}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase text-gray-500">
                        {task.assignedTo?.employeeId || "-"} | {task.assignedTo?.name || "-"}
                      </p>
                      <h2 className="mt-1 font-semibold text-gray-900 break-words">{task.title}</h2>
                      <p className="mt-1 text-xs text-gray-500">
                        {task.project || "No Project"} | {task.phase || "No Phase"} | {statusLabels[task.status] || task.status}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-sm px-2 py-1 text-xs font-semibold capitalize ${important ? "bg-red-600 text-white" : "bg-[#fff5f3] text-[#f84525]"}`}>
                      {task.priority || "normal"}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-gray-600">
                    <p><b>Tech:</b> {task.tech || "-"}</p>
                    <p><b>Billing:</b> {task.billing || "-"}</p>
                    <p><b>Source:</b> {task.taskSource || "-"}</p>
                    <p><b>Time:</b> {task.timing || "-"}</p>
                    <p><b>Collaborator:</b> {task.collaborator || "-"}</p>
                    <p><b>Remark:</b> {task.remark || "-"}</p>
                  </div>

                  {task.url && (
                    <a href={getExternalUrl(task.url)} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-[#f84525] underline break-all">
                      Open URL
                    </a>
                  )}

                  {task.description && (
                    <p className="mt-3 max-h-20 overflow-y-auto rounded-sm bg-gray-50 p-3 text-sm text-gray-700 break-words">
                      {task.description}
                    </p>
                  )}

                  {(task.reply || attachments.length > 0) && (
                    <div className="mt-3 border-t pt-3">
                      {task.reply && <p className="text-sm text-gray-700 break-words"><b>Reply:</b> {task.reply}</p>}
                      {attachments.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {attachments.slice(0, 4).map((item, index) => (
                            <a key={`${item.url}-${index}`} href={item.url} target="_blank" rel="noreferrer" className="h-12 w-12 overflow-hidden rounded-sm border block">
                              <img src={item.url} alt={item.name || "Task attachment"} className="h-full w-full object-cover" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1500px] w-full text-sm">
              <thead className="bg-gray-100 text-xs uppercase text-gray-600">
                <tr>
                  {["Employee", "Phase", "Project", "Task Title", "URL", "Description", "Images", "Tech", "Time", "Collaborator", "Status", "Reply", "Billing", "Priority", "Source", "Remark", ...(!isHr ? ["Actions"] : [])].map((item) => (
                    <th key={item} className="px-3 py-3 text-left">{item}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => {
                  const important = ["important", "urgent"].includes(task.priority);
                  return (
                    <tr key={task._id} className={`border-t align-top ${important ? "bg-red-50/70" : ""}`}>
                      <td className="px-3 py-3 min-w-[150px]">{task.assignedTo?.name || "-"}</td>
                      <td className="px-3 py-3">{task.phase || "-"}</td>
                      <td className="px-3 py-3">{task.project || "-"}</td>
                      <td className="px-3 py-3 font-medium max-w-[180px] break-words">{task.title}</td>
                      <td className="px-3 py-3">{task.url ? <a href={getExternalUrl(task.url)} target="_blank" rel="noreferrer" className="text-[#f84525] underline">Open</a> : "-"}</td>
                      <td className="px-3 py-3 max-w-[260px] break-words">{task.description || "-"}</td>
                      <td className="px-3 py-3">
                        {[...(task.attachments || []), ...(task.responseAttachments || [])].length ? (
                          <div className="flex gap-1">
                            {[...(task.attachments || []), ...(task.responseAttachments || [])].slice(0, 3).map((item, index) => (
                              <a key={`${item.url}-${index}`} href={item.url} target="_blank" rel="noreferrer" className="h-10 w-10 overflow-hidden rounded-sm border block">
                                <img src={item.url} alt={item.name || "Task attachment"} className="h-full w-full object-cover" />
                              </a>
                            ))}
                          </div>
                        ) : "-"}
                      </td>
                      <td className="px-3 py-3">{task.tech || "-"}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2 min-w-[150px]">
                          <input
                            type="time"
                            value={task.timing || ""}
                            onChange={(e) => updateTaskInline(task._id, "timing", e.target.value)}
                            className="w-24 border rounded-sm px-2 py-1.5"
                          />
                          <Button
                            text="Save"
                            className="text-xs px-2 py-1.5"
                            loading={savingTimeId === task._id}
                            onClick={() => updateTaskTime(task)}
                          />
                        </div>
                      </td>
                      <td className="px-3 py-3">{task.collaborator || "-"}</td>
                      <td className="px-3 py-3">{statusLabels[task.status] || task.status}</td>
                      <td className="px-3 py-3 max-w-[180px] break-words">{task.reply || "-"}</td>
                      <td className="px-3 py-3">{task.billing || "-"}</td>
                      <td className={`px-3 py-3 capitalize font-semibold ${important ? "text-red-700" : ""}`}>{task.priority}</td>
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default TaskManagement;
