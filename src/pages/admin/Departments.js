/* eslint-disable */
import { useApi } from "../../contexts/ApiContext";
import { useEffect, useState } from "react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";

import Button from "../../components/common/Button";
import CommonLoader from "../../components/common/CommonLoader";
import InputField from "../../components/common/InputField";
import CustomDropdown from "../../components/common/CustomDropdown";
import { useModal } from "../../contexts/ModalContext";
import { useToast } from "../../contexts/ToastContext";

const emptyForm = {
  name: "",
  description: "",
  isActive: true,
};

const MasterOptionsSection = ({ type, title, description }) => {
  const { authApi } = useApi();
  const toast = useToast();
  const { confirm } = useModal();
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await authApi.getMasterOptions(type, { includeInactive: true });
      setItems(res.data.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || `Unable to load ${title}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const reset = () => {
    setEditing(null);
    setName("");
  };

  const save = async (event) => {
    event.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await authApi.updateMasterOption(type, editing._id, { name: name.trim() });
        toast.success(`${title} updated`);
      } else {
        await authApi.createMasterOption(type, { name: name.trim() });
        toast.success(`${title} added`);
      }
      reset();
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || `Unable to save ${title}`);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item) => {
    const ok = await confirm({
      title: `Delete ${title}`,
      message: `Delete “${item.name}”?`,
      confirmText: "Delete",
      tone: "danger",
    });
    if (!ok) return;

    try {
      await authApi.deleteMasterOption(type, item._id);
      toast.success(`${title} deleted`);
      await load();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to delete option");
    }
  };

  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-[#f1e7e4] bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
        <h2 className="font-semibold text-gray-950 dark:text-white">{title}</h2>
        <p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">{description}</p>
      </div>

      <form
        onSubmit={save}
        className="flex gap-2 border-b border-gray-100 p-3 dark:border-gray-800"
      >
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={`Add ${title.replace(" Master", "")}`}
          className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-[#f84525] focus:ring-2 focus:ring-[#f84525]/10 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
          required
        />
        <Button
          type="submit"
          loading={saving}
          text={editing ? "Save" : "Add"}
          className="shrink-0 px-3"
        />
        {editing && (
          <Button
            type="button"
            variant="secondary"
            text="Cancel"
            onClick={reset}
            className="shrink-0 px-3"
          />
        )}
      </form>

      {loading ? (
        <CommonLoader text={`Loading ${title}...`} />
      ) : items.length === 0 ? (
        <p className="p-5 text-center text-sm text-gray-500 dark:text-gray-400">
          No options added yet.
        </p>
      ) : (
        <div className="max-h-72 divide-y divide-gray-100 overflow-y-auto dark:divide-gray-800">
          {items.map((item) => (
            <div
              key={item._id}
              className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-gray-800 dark:text-gray-100">{item.name}</p>
                {item.isActive === false && <p className="text-[11px] text-gray-400">Inactive</p>}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setEditing(item);
                    setName(item.name);
                  }}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md border border-gray-200 px-2.5 text-xs font-semibold text-gray-600 transition hover:border-[#f84525]/40 hover:text-[#f84525] dark:border-gray-700 dark:text-gray-300"
                >
                  <FiEdit2 className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => remove(item)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md border border-red-100 px-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-950/30"
                >
                  <FiTrash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

const Departments = () => {
  const { authApi } = useApi();
  const toast = useToast();
  const { confirm } = useModal();
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const loadDepartments = async () => {
    setLoading(true);
    try {
      const res = await authApi.getDepartments({ includeInactive: true });
      setDepartments(res.data.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to load departments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId("");
    setShowForm(false);
  };

  const saveDepartment = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await authApi.updateDepartment(editingId, form);
        toast.success("Department updated");
      } else {
        await authApi.createDepartment(form);
        toast.success("Department added");
      }
      resetForm();
      await loadDepartments();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to save department");
    } finally {
      setSaving(false);
    }
  };

  const editDepartment = (department) => {
    setEditingId(department._id);
    setShowForm(true);
    setForm({
      name: department.name || "",
      description: department.description || "",
      isActive: department.isActive !== false,
    });
  };

  const toggleDepartment = async (department) => {
    try {
      await authApi.updateDepartment(department._id, { isActive: !department.isActive });
      toast.success(department.isActive ? "Department disabled" : "Department enabled");
      await loadDepartments();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to update department");
    }
  };

  const deleteDepartment = async (department) => {
    const ok = await confirm({
      title: "Delete Department",
      message: `Delete ${department.name}? Existing employee records will keep their saved department text.`,
      confirmText: "Delete",
      tone: "danger",
    });
    if (!ok) return;

    try {
      await authApi.deleteDepartment(department._id);
      toast.success("Department deleted");
      if (editingId === department._id) resetForm();
      await loadDepartments();
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to delete department");
    }
  };

  if (loading) return <CommonLoader text="Loading departments..." />;

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-xl border border-[#f1e7e4] bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#f84525]">
              Configuration
            </p>
            <h1 className="mt-1 text-2xl font-bold text-gray-950 dark:text-white">
              Organization Master Data
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Manage departments and values used across employee forms.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={loadDepartments}
              text="Refresh"
              className="gap-2"
            />
            <Button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              text="Add Department"
              className="gap-2"
            />
          </div>
        </div>
      </section>

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) resetForm();
          }}
        >
          <form
            onSubmit={saveDepartment}
            onMouseDown={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-5 shadow-2xl dark:border-gray-700 dark:bg-gray-900"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#f84525]">
                  Department
                </p>
                <h2 className="mt-1 text-lg font-bold text-gray-950 dark:text-white">
                  {editingId ? "Update Department" : "Add Department"}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={resetForm}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              >
                ×
              </button>
            </div>
            <div className="mt-4 space-y-4">
              <InputField
                label="Department Name"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                required
              />
              <InputField
                label="Description"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
              />
              <CustomDropdown
                label="Status"
                value={form.isActive ? "active" : "inactive"}
                onChange={(value) =>
                  setForm((current) => ({ ...current, isActive: value === "active" }))
                }
                options={[
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                ]}
                showPlaceholder={false}
              />
            </div>
            <div className="mt-5 flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
              <Button text="Cancel" variant="secondary" onClick={resetForm} />
              <Button
                type="submit"
                loading={saving}
                text={editingId ? "Save Department" : "Add Department"}
              />
            </div>
          </form>
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-[#f1e7e4] bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
          <div>
            <h2 className="font-semibold text-gray-950 dark:text-white">Departments</h2>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {departments.length} configured departments
            </p>
          </div>
        </div>

        <div className="hidden grid-cols-[1.2fr_1.5fr_0.7fr_0.8fr_1fr] bg-gray-50 text-[11px] font-bold uppercase tracking-wide text-gray-500 md:grid dark:bg-gray-800/70 dark:text-gray-400">
          {["Department", "Description", "Status", "Updated", "Actions"].map((heading) => (
            <div key={heading} className="px-4 py-2.5">
              {heading}
            </div>
          ))}
        </div>

        {departments.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No departments added yet.
          </p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {departments.map((department) => (
              <div
                key={department._id}
                className="grid grid-cols-1 gap-3 px-4 py-3 text-sm md:grid-cols-[1.2fr_1.5fr_0.7fr_0.8fr_1fr] md:items-center"
              >
                <p className="font-semibold text-gray-900 dark:text-gray-100">{department.name}</p>
                <p className="truncate text-gray-500 dark:text-gray-400">
                  {department.description || "No description"}
                </p>
                <button
                  type="button"
                  onClick={() => toggleDepartment(department)}
                  className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${department.isActive ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-900" : "bg-gray-100 text-gray-600 ring-1 ring-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700"}`}
                >
                  {department.isActive ? "Active" : "Inactive"}
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {department.updatedAt
                    ? new Date(department.updatedAt).toLocaleDateString("en-IN")
                    : "-"}
                </p>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => editDepartment(department)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-md border border-gray-200 px-2.5 text-xs font-semibold text-gray-600 transition hover:border-[#f84525]/40 hover:text-[#f84525] dark:border-gray-700 dark:text-gray-300"
                  >
                    <FiEdit2 className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteDepartment(department)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-md border border-red-100 px-2.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900/40 dark:text-red-400 dark:hover:bg-red-950/30"
                  >
                    <FiTrash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3">
          <h2 className="font-semibold text-gray-950 dark:text-white">Employee Master Lists</h2>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            Reusable values for employee add and update forms.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <MasterOptionsSection
            type="bloodGroup"
            title="Blood Group Master"
            description="Blood groups available in employee forms."
          />
          <MasterOptionsSection
            type="gender"
            title="Gender Master"
            description="Gender values available in employee add and update forms."
          />
          <MasterOptionsSection
            type="qualification"
            title="Qualification Master"
            description="Qualification levels used for employee education records."
          />
          <MasterOptionsSection
            type="employeeType"
            title="Employment Type Master"
            description="Permanent, probation, internship, and custom types."
          />
          <MasterOptionsSection
            type="designation"
            title="Designation Master"
            description="Job designations available in employee forms."
          />
          <MasterOptionsSection
            type="trainingPeriod"
            title="Probation Period Master"
            description="Probation periods such as 1, 3, or 6 months."
          />
          <MasterOptionsSection
            type="bondPeriod"
            title="Bond Period Master"
            description="Bond durations such as 15 days, 1 month, 2 months, or 3 months."
          />
        </div>
      </section>
    </div>
  );
};

export default Departments;
