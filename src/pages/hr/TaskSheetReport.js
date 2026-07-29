import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { hrApi } from "../../api";
import Button from "../../components/common/Button";
import CommonLoader from "../../components/common/CommonLoader";
import { AuthContext } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";

const todayKey = () => new Date().toISOString().slice(0, 10);
const monthKey = () => new Date().toISOString().slice(0, 7);

const statusLabels = {
  pending: "Pending",
  in_progress: "On Process",
  completed: "Complete",
  blocked: "Blocked",
  cancelled: "Cancelled",
};

const getExternalUrl = (value) => {
  const url = String(value || "").trim();
  if (!url) return "";
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(url) ? url : `https://${url}`;
};

const truncateText = (value, limit = 90) => {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  return text.length > limit ? `${text.slice(0, limit).trim()}...` : text;
};

const TaskSheetReport = () => {
  const toast = useToast();
  const { user } = useContext(AuthContext);
  const isHr = user?.role === "hr";
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [date, setDate] = useState(todayKey());
  const [month, setMonth] = useState(monthKey());
  const [viewMode, setViewMode] = useState("month");
  const [projectFilter, setProjectFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingTimeId, setSavingTimeId] = useState("");
  const [mailing, setMailing] = useState(false);

  const getTaskFilters = useCallback(
    () => ({
      date: !isHr && viewMode === "date" ? date : undefined,
      month: isHr || viewMode === "month" ? month : undefined,
      employeeId: employeeFilter || undefined,
      project: projectFilter || undefined,
      status: statusFilter || undefined,
      search: search.trim() || undefined,
    }),
    [date, employeeFilter, isHr, month, projectFilter, search, statusFilter, viewMode]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const requests = [hrApi.getEmployees(), hrApi.getTasks(getTaskFilters())];
      if (!isHr) requests.push(hrApi.getTaskProjects());
      const [employeeRes, taskRes, projectRes] = await Promise.all(requests);
      setEmployees(employeeRes.data.data || []);
      setTasks(taskRes.data.data || []);
      if (!isHr) setProjects(projectRes?.data?.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to load task sheet");
    } finally {
      setLoading(false);
    }
  }, [getTaskFilters, isHr, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const projectOptions = useMemo(
    () =>
      [...projects.map((project) => project.name), ...tasks.map((task) => task.project)]
        .map((value) => String(value || "").trim())
        .filter(Boolean)
        .filter((value, index, values) => values.indexOf(value) === index)
        .sort(),
    [projects, tasks]
  );

  const exportRows = () =>
    tasks.map((task, index) => ({
      "S.NO": index + 1,
      "HANDEL BY": task.assignedBy?.name || "",
      "ASSIGNED TO": task.handledBy || task.assignedTo?.name || "",
      PHASES: task.phase || "",
      PROJECT: task.project || "",
      "TASK TITLE": task.title || "",
      URL: task.url || "",
      "TASK DESCRIPTION": truncateText(task.description, 120),
      "TASK ETC": task.tech || "",
      "TASK TIMING": task.timing || "",
      "TASK COLLABORATOR": task.collaborator || "",
      STATUS: statusLabels[task.status] || task.status || "",
      REPLY: task.reply || "",
      BILLING: task.billing || "",
      PRIORITY: task.priority || "",
      "TASK SOURCE": task.taskSource || "",
      REMARK: task.remark || "",
    }));

  const downloadSheet = () => {
    const rows = exportRows();
    const sheet = XLSX.utils.json_to_sheet(rows);
    sheet["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rows.length, c: 16 } }) };
    sheet["!cols"] = [
      { wch: 7 },
      { wch: 18 },
      { wch: 20 },
      { wch: 16 },
      { wch: 24 },
      { wch: 32 },
      { wch: 18 },
      { wch: 44 },
      { wch: 14 },
      { wch: 14 },
      { wch: 22 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 18 },
      { wch: 24 },
    ];
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Task Sheet");
    const safeProject = projectFilter ? `-${projectFilter.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}` : "";
    const safeStatus = statusFilter ? `-${statusFilter}` : "";
    XLSX.writeFile(book, `task-sheet-${month}${safeProject}${safeStatus}.xlsx`);
  };

  const mailSheet = async () => {
    setMailing(true);
    try {
      await hrApi.mailTaskSheet({ ...getTaskFilters(), descriptionLimit: 120 });
      toast.success("Task sheet mailed to admin email");
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to mail task sheet");
    } finally {
      setMailing(false);
    }
  };

  const updateTaskInline = (taskId, field, value) => {
    setTasks((current) =>
      current.map((task) => (task._id === taskId ? { ...task, [field]: value } : task))
    );
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

  if (loading) return <CommonLoader text="Loading task sheet..." />;

  return (
    <div className="space-y-5">
      <section className="bg-white rounded-sm shadow p-4">
        <h1 className="text-xl font-bold text-gray-900">Task Sheet Report</h1>
        <p className="text-sm text-gray-500 mt-1">
          Filter, review, export, and mail the monthly task sheet.
        </p>
      </section>

      <section className="bg-white rounded-sm shadow overflow-hidden">
        <div className="p-4 border-b bg-gray-50 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[150px_180px_minmax(0,1fr)_minmax(0,1fr)_180px_minmax(0,1.2fr)_auto]">
          {!isHr && (
            <select value={viewMode} onChange={(e) => setViewMode(e.target.value)} className="border rounded-sm px-3 py-2">
              <option value="date">Daily View</option>
              <option value="month">Monthly Sheet</option>
            </select>
          )}
          {isHr || viewMode === "month" ? (
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="border rounded-sm px-3 py-2" />
          ) : (
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border rounded-sm px-3 py-2" />
          )}
          {isHr && <div className="hidden xl:block" />}
          <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="border rounded-sm px-3 py-2">
            <option value="">All projects</option>
            {projectOptions.map((project) => (
              <option key={project} value={project}>{project}</option>
            ))}
          </select>
          <select value={employeeFilter} onChange={(e) => setEmployeeFilter(e.target.value)} className="border rounded-sm px-3 py-2">
            <option value="">All employees</option>
            {employees.map((employee) => (
              <option key={employee._id} value={employee._id}>
                {employee.employeeId || "-"} - {employee.name}
              </option>
            ))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded-sm px-3 py-2">
            <option value="">All status</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search task, employee, project, reply"
            className="border rounded-sm px-3 py-2"
          />
          <div className="flex flex-col sm:flex-row gap-2">
            <Button text="Export Sheet" onClick={downloadSheet} disabled={tasks.length === 0} />
            <Button text="Mail Export" variant="secondary" onClick={mailSheet} loading={mailing} disabled={tasks.length === 0} />
          </div>
        </div>

        {tasks.length === 0 ? (
          <p className="p-8 text-center text-gray-500">No tasks found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1680px] w-full text-sm">
              <thead className="bg-[#f6b15f] text-xs uppercase text-gray-900">
                <tr>
                  {["S.NO", "Handel By", "Assigned To", "Phases", "Project", "Task Title", "URL", "Task Description", "Task ETC", "Task Timing", "Task Collaborator", "Status", "Reply", "Billing", "Priority", "Task Source", "Remark"].map((item) => (
                    <th key={item} className="px-2 py-2 text-left border border-[#d99a4d]">{item}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tasks.map((task, index) => {
                  const important = ["important", "urgent"].includes(task.priority);
                  return (
                    <tr key={task._id} className={`align-middle ${important ? "bg-red-50/70" : ""}`}>
                      <td className="px-2 py-2 border border-gray-200 text-center font-semibold">{index + 1}</td>
                      <td className="px-2 py-2 border border-gray-200 whitespace-nowrap">{task.assignedBy?.name || "-"}</td>
                      <td className="px-2 py-2 border border-gray-200 min-w-[150px] whitespace-nowrap">{task.handledBy || task.assignedTo?.name || "-"}</td>
                      <td className="px-2 py-2 border border-gray-200 whitespace-nowrap">{task.phase || "-"}</td>
                      <td className="px-2 py-2 border border-gray-200 max-w-[190px]">
                        <span className="block truncate" title={task.project || ""}>{task.project || "-"}</span>
                      </td>
                      <td className="px-2 py-2 border border-gray-200 font-medium max-w-[210px]">
                        <span className="block truncate" title={task.title || ""}>{task.title || "-"}</span>
                      </td>
                      <td className="px-2 py-2 border border-gray-200">
                        {task.url ? <a href={getExternalUrl(task.url)} target="_blank" rel="noreferrer" className="text-[#f84525] underline">Open</a> : "-"}
                      </td>
                      <td className="px-2 py-2 border border-gray-200 w-[240px] max-w-[240px]">
                        <span className="block truncate text-gray-700" title={task.description || ""}>
                          {truncateText(task.description, 70) || "-"}
                        </span>
                      </td>
                      <td className="px-2 py-2 border border-gray-200 whitespace-nowrap">{task.tech || "-"}</td>
                      <td className="px-2 py-2 border border-gray-200">
                        <div className="flex items-center gap-2 min-w-[150px]">
                          <input
                            type="text"
                            placeholder="2h 30m"
                            value={task.timing || ""}
                            onChange={(e) => updateTaskInline(task._id, "timing", e.target.value)}
                            className="w-32 border rounded-sm px-2 py-1.5"
                          />
                          <Button
                            text="Save"
                            className="text-xs px-2 py-1.5"
                            loading={savingTimeId === task._id}
                            onClick={() => updateTaskTime(task)}
                          />
                        </div>
                      </td>
                      <td className="px-2 py-2 border border-gray-200 max-w-[180px]">
                        <span className="block truncate" title={task.collaborator || ""}>{task.collaborator || "-"}</span>
                      </td>
                      <td className="px-2 py-2 border border-gray-200 whitespace-nowrap">{statusLabels[task.status] || task.status}</td>
                      <td className="px-2 py-2 border border-gray-200 max-w-[180px]">
                        <span className="block truncate" title={task.reply || ""}>{truncateText(task.reply, 55) || "-"}</span>
                      </td>
                      <td className="px-2 py-2 border border-gray-200 whitespace-nowrap">{task.billing || "-"}</td>
                      <td className={`px-2 py-2 border border-gray-200 capitalize font-semibold ${important ? "text-red-700" : ""}`}>{task.priority}</td>
                      <td className="px-2 py-2 border border-gray-200 max-w-[160px]">
                        <span className="block truncate" title={task.taskSource || ""}>{task.taskSource || "-"}</span>
                      </td>
                      <td className="px-2 py-2 border border-gray-200 max-w-[180px]">
                        <span className="block truncate" title={task.remark || ""}>{truncateText(task.remark, 55) || "-"}</span>
                      </td>
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

export default TaskSheetReport;
