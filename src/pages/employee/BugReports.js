import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { FiImage, FiUploadCloud, FiX } from "react-icons/fi";
import { employeeApi, hrApi } from "../../api";
import Button from "../../components/common/Button";
import CommonLoader from "../../components/common/CommonLoader";
import FilePreviewModal from "../../components/common/FilePreviewModal";
import { AuthContext } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";

const defaultForm = {
  siteUrl: "",
  projectId: "",
  project: "",
  projectUrl: "",
  pageUrl: "",
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

const getPastedImages = async (event) => {
  const items = Array.from(event.clipboardData?.items || []);
  const imageFiles = items
    .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
    .map((item) => item.getAsFile())
    .filter(Boolean);
  return Promise.all(imageFiles.map(fileToDataUri));
};

const getExternalUrl = (value) => {
  const url = String(value || "").trim();
  if (!url) return "";
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(url) ? url : `https://${url}`;
};

const buildBugUrl = (form) => {
  const pageUrl = String(form.pageUrl || "").trim();
  const baseUrl = String(form.projectUrl || form.siteUrl || "").trim();
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(pageUrl)) return pageUrl;
  if (pageUrl && baseUrl) {
    return `${baseUrl.replace(/\/+$/, "")}/${pageUrl.replace(/^\/+/, "")}`;
  }
  return pageUrl || baseUrl;
};

const ScreenshotDropzone = ({ label, images = [], onChange, onPreview, compact = false }) => {
  const addFiles = async (files) => {
    const selected = Array.from(files || []).filter((file) => file.type?.startsWith("image/"));
    if (!selected.length) return;
    const nextImages = await Promise.all(selected.map(fileToDataUri));
    onChange([...(images || []), ...nextImages]);
  };

  const handlePaste = async (event) => {
    const pastedImages = await getPastedImages(event);
    if (!pastedImages.length) return;
    event.preventDefault();
    onChange([...(images || []), ...pastedImages]);
  };

  const removeImage = (indexToRemove) => {
    onChange(images.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium text-gray-700">{label}</p>}
      <div
        tabIndex={0}
        onPaste={handlePaste}
        onDragOver={(event) => {
          event.preventDefault();
          event.currentTarget.classList.add("border-[#f84525]", "bg-[#fff5f3]");
        }}
        onDragLeave={(event) => {
          event.currentTarget.classList.remove("border-[#f84525]", "bg-[#fff5f3]");
        }}
        onDrop={(event) => {
          event.preventDefault();
          event.currentTarget.classList.remove("border-[#f84525]", "bg-[#fff5f3]");
          addFiles(event.dataTransfer.files);
        }}
        className={`rounded-sm border-2 border-dashed border-gray-300 bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#f84525] ${
          compact ? "p-3" : "p-4"
        }`}
      >
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-sm border border-gray-200 bg-white px-3 py-4 text-center hover:border-[#f84525] hover:bg-[#fffafa]">
          <FiUploadCloud className="text-2xl text-[#f84525]" />
          <span className="text-sm font-semibold text-gray-900">Drop, paste, or browse screenshots</span>
          <span className="text-xs text-gray-500">Multiple images supported. Click any thumbnail to preview.</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => addFiles(event.target.files)}
            className="sr-only"
          />
        </label>

        {images.length > 0 ? (
          <div className="mt-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-gray-600">{images.length} screenshot{images.length === 1 ? "" : "s"} selected</span>
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs font-semibold text-[#f84525] hover:underline"
              >
                Remove all
              </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {images.map((item, index) => (
                <div key={`${item.name}-${index}`} className="group relative aspect-square overflow-hidden rounded-sm border bg-white">
                  <button
                    type="button"
                    onClick={() => onPreview?.({ title: item.name || "Screenshot", url: item.dataUri || item.url })}
                    className="h-full w-full"
                  >
                    {item.dataUri || item.url ? (
                      <img src={item.dataUri || item.url} alt={item.name || "Screenshot"} className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-gray-400">
                        <FiImage />
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-sm bg-black/70 text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                    aria-label="Remove screenshot"
                  >
                    <FiX />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

const BugReports = ({ scope = "employee" }) => {
  const { user } = useContext(AuthContext);
  const toast = useToast();
  const api = scope === "managed" ? hrApi : employeeApi;
  const effectiveRole = user?.effectiveRole || user?.role;
  const [access, setAccess] = useState(null);
  const canCreateBug = ["tester", "teamlead"].includes(effectiveRole) || Boolean(access?.isTester || access?.isTeamLead);
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [bugs, setBugs] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [status, setStatus] = useState("");
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingId, setSavingId] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const requests = [api.getBugs({ status: status || undefined }), employeeApi.getMyAccess()];
      if (canCreateBug) {
        requests.push(hrApi.getEmployees(), employeeApi.getTaskProjects());
      }
      const [bugRes, accessRes, employeeRes, projectRes] = await Promise.all(requests);
      const accessData = accessRes.data.data || {};
      const allowedToCreate = ["tester", "teamlead"].includes(effectiveRole) || Boolean(accessData.isTester || accessData.isTeamLead);
      setBugs(bugRes.data.data || []);
      setAccess(accessData);
      if (employeeRes) {
        setEmployees(employeeRes.data.data || []);
        setProjects(projectRes?.data?.data || []);
      } else if (allowedToCreate) {
        const [employeeListRes, projectListRes] = await Promise.all([
          hrApi.getEmployees(),
          employeeApi.getTaskProjects(),
        ]);
        setEmployees(employeeListRes.data.data || []);
        setProjects(projectListRes.data.data || []);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to load bugs");
    } finally {
      setLoading(false);
    }
  }, [api, canCreateBug, effectiveRole, status, toast]);

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

  const createBug = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createBug({ ...form, siteUrl: buildBugUrl(form) });
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
              Running Project
              <select
                value={form.projectId}
                onChange={(e) => {
                  const project = projects.find((item) => item._id === e.target.value);
                  setForm((prev) => ({
                    ...prev,
                    projectId: project?._id || "",
                    project: project?.name || "",
                    projectUrl: project?.url || "",
                    siteUrl: project?.url || prev.siteUrl,
                  }));
                }}
                className="mt-1 w-full border rounded-sm px-3 py-2"
              >
                <option value="">Select running project</option>
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.name} - {project.environment || "running"}
                  </option>
                ))}
              </select>
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
              Project Base URL
              <input
                value={form.projectUrl || form.siteUrl}
                onChange={(e) => setForm((prev) => ({ ...prev, projectUrl: e.target.value, siteUrl: e.target.value }))}
                className="mt-1 w-full border rounded-sm px-3 py-2"
                required
              />
            </label>
            <label className="text-sm font-medium text-gray-700 md:col-span-2">
              Specific Page URL
              <input
                value={form.pageUrl}
                onChange={(e) => setForm((prev) => ({ ...prev, pageUrl: e.target.value }))}
                placeholder="/about, /seller/products, or full URL"
                className="mt-1 w-full border rounded-sm px-3 py-2"
              />
            </label>
            <div className="md:col-span-4 rounded-sm border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600 break-all">
              Final URL: {buildBugUrl(form) || "-"}
            </div>
            <label className="text-sm font-medium text-gray-700 md:col-span-2">
              Bug Title
              <input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} className="mt-1 w-full border rounded-sm px-3 py-2" required />
            </label>
            <label className="text-sm font-medium text-gray-700 md:col-span-2">
              Screenshots
              <ScreenshotDropzone
                images={form.screenshots}
                onChange={(screenshots) => setForm((prev) => ({ ...prev, screenshots }))}
                onPreview={setPreview}
              />
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
                      <button
                        key={`${item.url}-${index}`}
                        type="button"
                        onClick={() => setPreview({ title: item.name || bug.title || "Bug screenshot", url: item.url })}
                        className="block h-20 w-20 overflow-hidden rounded-sm border bg-white"
                        title="Open screenshot"
                      >
                        <img src={item.url} alt={item.name || "Bug attachment"} className="h-full w-full object-cover" />
                      </button>
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
                    <ScreenshotDropzone
                      images={bug.newAttachments || []}
                      onChange={(newAttachments) => updateBugInline(bug._id, "newAttachments", newAttachments)}
                      onPreview={setPreview}
                      compact
                    />
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

export default BugReports;
