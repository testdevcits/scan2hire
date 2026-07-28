import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { employeeApi, hrApi } from "../../api";
import Button from "../../components/common/Button";
import CommonLoader from "../../components/common/CommonLoader";
import { AuthContext } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";

const defaultForm = {
  siteUrl: "",
  title: "",
  description: "",
  stepsToReproduce: "",
  expectedResult: "",
  actualResult: "",
  severity: "medium",
  assignedTo: "",
  screenshots: [],
};

const statusLabels = {
  open: "Open",
  in_progress: "On Process",
  fixed: "Fixed",
  reopen: "Reopen",
  closed: "Closed",
};

const fileToDataUri = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, dataUri: reader.result, resourceType: "image" });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const getExternalUrl = (value) => {
  const url = String(value || "").trim();
  if (!url) return "";
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(url) ? url : `https://${url}`;
};

const BugReports = ({ scope = "employee" }) => {
  const { user } = useContext(AuthContext);
  const toast = useToast();
  const api = scope === "managed" ? hrApi : employeeApi;
  const effectiveRole = user?.effectiveRole || user?.role;
  const canCreateBug = ["tester", "teamlead"].includes(effectiveRole);
  const [employees, setEmployees] = useState([]);
  const [bugs, setBugs] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingId, setSavingId] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const requests = [api.getBugs({ status: status || undefined })];
      if (canCreateBug) requests.push(hrApi.getEmployees());
      const [bugRes, employeeRes] = await Promise.all(requests);
      setBugs(bugRes.data.data || []);
      if (employeeRes) setEmployees(employeeRes.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to load bugs");
    } finally {
      setLoading(false);
    }
  }, [api, canCreateBug, status, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const stats = useMemo(
    () => ({
      total: bugs.length,
      open: bugs.filter((bug) => bug.status === "open").length,
      running: bugs.filter((bug) => bug.status === "in_progress").length,
      fixed: bugs.filter((bug) => bug.status === "fixed").length,
    }),
    [bugs]
  );

  const handleFiles = async (files, setter, field) => {
    const selected = Array.from(files || []);
    const images = await Promise.all(selected.map(fileToDataUri));
    setter((prev) => ({ ...prev, [field]: images }));
  };

  const createBug = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createBug(form);
      toast.success("Bug added and assigned");
      setForm(defaultForm);
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to add bug");
    } finally {
      setSaving(false);
    }
  };

  const updateBugInline = (bugId, field, value) => {
    setBugs((current) =>
      current.map((bug) => (bug._id === bugId ? { ...bug, [field]: value } : bug))
    );
  };

  const updateBug = async (bug) => {
    setSavingId(bug._id);
    try {
      await api.updateBug(bug._id, {
        status: bug.status,
        reply: bug.reply,
        fixNote: bug.fixNote,
        severity: bug.severity,
        assigneeAttachments: bug.newAttachments || [],
      });
      toast.success("Bug updated");
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to update bug");
    } finally {
      setSavingId("");
    }
  };

  if (loading) return <CommonLoader text="Loading bugs..." />;

  return (
    <div className="space-y-5">
      <section className="bg-white rounded-sm shadow p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Bugs</h1>
            <p className="text-sm text-gray-500 mt-1">
              Website bugs, screenshots, assignment, and developer replies in one place.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              ["Total", stats.total],
              ["Open", stats.open],
              ["On Process", stats.running],
              ["Fixed", stats.fixed],
            ].map(([label, value]) => (
              <div key={label} className="rounded-sm border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                <span className="block text-xs text-gray-500">{label}</span>
                <span className="font-semibold text-gray-900">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {canCreateBug && (
        <form onSubmit={createBug} className="bg-white rounded-sm shadow p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <label className="text-sm font-medium text-gray-700 md:col-span-2">
              Site URL
              <input value={form.siteUrl} onChange={(e) => setForm((prev) => ({ ...prev, siteUrl: e.target.value }))} className="mt-1 w-full border rounded-sm px-3 py-2" required />
            </label>
            <label className="text-sm font-medium text-gray-700">
              Assign To
              <select value={form.assignedTo} onChange={(e) => setForm((prev) => ({ ...prev, assignedTo: e.target.value }))} className="mt-1 w-full border rounded-sm px-3 py-2" required>
                <option value="">Select employee</option>
                {employees.map((employee) => (
                  <option key={employee._id} value={employee._id}>
                    {employee.employeeId || "-"} - {employee.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-gray-700">
              Severity
              <select value={form.severity} onChange={(e) => setForm((prev) => ({ ...prev, severity: e.target.value }))} className="mt-1 w-full border rounded-sm px-3 py-2">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </label>
            <label className="text-sm font-medium text-gray-700 md:col-span-2">
              Bug Title
              <input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} className="mt-1 w-full border rounded-sm px-3 py-2" required />
            </label>
            <label className="text-sm font-medium text-gray-700 md:col-span-2">
              Screenshots
              <input type="file" accept="image/*" multiple onChange={(e) => handleFiles(e.target.files, setForm, "screenshots")} className="mt-1 w-full border rounded-sm px-3 py-2" />
            </label>
            <label className="text-sm font-medium text-gray-700 md:col-span-2">
              Description
              <textarea value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} className="mt-1 w-full border rounded-sm px-3 py-2 min-h-[92px]" required />
            </label>
            <label className="text-sm font-medium text-gray-700 md:col-span-2">
              Steps To Reproduce
              <textarea value={form.stepsToReproduce} onChange={(e) => setForm((prev) => ({ ...prev, stepsToReproduce: e.target.value }))} className="mt-1 w-full border rounded-sm px-3 py-2 min-h-[92px]" />
            </label>
            <label className="text-sm font-medium text-gray-700 md:col-span-2">
              Expected Result
              <input value={form.expectedResult} onChange={(e) => setForm((prev) => ({ ...prev, expectedResult: e.target.value }))} className="mt-1 w-full border rounded-sm px-3 py-2" />
            </label>
            <label className="text-sm font-medium text-gray-700 md:col-span-2">
              Actual Result
              <input value={form.actualResult} onChange={(e) => setForm((prev) => ({ ...prev, actualResult: e.target.value }))} className="mt-1 w-full border rounded-sm px-3 py-2" />
            </label>
          </div>
          <Button text="Add Bug" type="submit" loading={saving} />
        </form>
      )}

      <section className="bg-white rounded-sm shadow overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="border rounded-sm px-3 py-2">
            <option value="">All status</option>
            {Object.entries(statusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {bugs.length === 0 ? (
          <p className="p-6 text-center text-sm text-gray-500">No bugs found.</p>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 p-4">
            {bugs.map((bug) => (
              <article key={bug._id} className="border border-gray-200 rounded-sm p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div>
                    <a href={getExternalUrl(bug.siteUrl)} target="_blank" rel="noreferrer" className="text-xs text-[#f84525] underline break-all">
                      {bug.siteUrl}
                    </a>
                    <h2 className="font-semibold text-gray-900 mt-1">{bug.title}</h2>
                    <p className="text-xs text-gray-500">
                      Assigned to {bug.assignedTo?.name || "-"} | Reported by {bug.reportedBy?.name || "-"}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-sm capitalize ${bug.severity === "critical" ? "bg-red-600 text-white" : "bg-amber-50 text-amber-700"}`}>
                    {bug.severity}
                  </span>
                </div>

                <p className="text-sm text-gray-700 break-words">{bug.description}</p>
                {bug.stepsToReproduce && <p className="text-sm text-gray-600 break-words"><b>Steps:</b> {bug.stepsToReproduce}</p>}
                {(bug.expectedResult || bug.actualResult) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                    <p><b>Expected:</b> {bug.expectedResult || "-"}</p>
                    <p><b>Actual:</b> {bug.actualResult || "-"}</p>
                  </div>
                )}

                {[...(bug.screenshots || []), ...(bug.assigneeAttachments || [])].length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {[...(bug.screenshots || []), ...(bug.assigneeAttachments || [])].map((item, index) => (
                      <a key={`${item.url}-${index}`} href={item.url} target="_blank" rel="noreferrer" className="block h-20 w-20 overflow-hidden rounded-sm border">
                        <img src={item.url} alt={item.name || "Bug attachment"} className="h-full w-full object-cover" />
                      </a>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="text-sm font-medium text-gray-700">
                    Status
                    <select value={bug.status} onChange={(e) => updateBugInline(bug._id, "status", e.target.value)} className="mt-1 w-full border rounded-sm px-3 py-2">
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm font-medium text-gray-700">
                    Add Images
                    <input type="file" accept="image/*" multiple onChange={async (e) => {
                      const images = await Promise.all(Array.from(e.target.files || []).map(fileToDataUri));
                      updateBugInline(bug._id, "newAttachments", images);
                    }} className="mt-1 w-full border rounded-sm px-3 py-2" />
                  </label>
                  <label className="text-sm font-medium text-gray-700">
                    Reply
                    <textarea value={bug.reply || ""} onChange={(e) => updateBugInline(bug._id, "reply", e.target.value)} className="mt-1 w-full border rounded-sm px-3 py-2 min-h-[76px]" />
                  </label>
                  <label className="text-sm font-medium text-gray-700">
                    Fix Note
                    <textarea value={bug.fixNote || ""} onChange={(e) => updateBugInline(bug._id, "fixNote", e.target.value)} className="mt-1 w-full border rounded-sm px-3 py-2 min-h-[76px]" />
                  </label>
                </div>
                <Button text="Update Bug" loading={savingId === bug._id} onClick={() => updateBug(bug)} />
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default BugReports;
