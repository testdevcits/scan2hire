import { employeeRecordPermissionKeys } from "../../config/employeeRecordPermissions";
import { useState } from "react";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";

const ModulePermissionMatrix = ({ modules, value, onChange, actions = ["view", "edit"] }) => (
  <div className="divide-y rounded border border-gray-200 dark:border-gray-700">
    {modules.map((item, index) => {
      const [key, label, moduleActions, actionLabels = {}] = item;
      if (key === "employeeRecordGroup") {
        const recordValue = value[key] || {};
        const updateRecordPermissions = (next) => {
          onChange(key, next);
          if (next.view === true) onChange("employees", { ...(value.employees || {}), view: true });
        };
        const recordChildren = [
          ["currentRecordControl", "Salary Record", ["currentView", "current"], { currentView: "View", current: "Add / Update" }],
          ["nextReviewControl", "Appraisal Review", ["nextReviewView", "nextReview"], { nextReviewView: "View", nextReview: "Add / Update" }],
          ["leavingControl", "Leaving Process", ["leavingView", "leaving"], { leavingView: "View", leaving: "Add / Update" }],
          ["nafControl", "NAF Process", ["nafView", "naf"], { nafView: "View", naf: "Add / Update" }],
          ["documentsProvidedControl", "Documents Provided", ["documentsProvidedView", "documentsProvided"], { documentsProvidedView: "View", documentsProvided: "Add / Update" }],
          ["salaryReleaseControl", "Salary Release", ["salaryReleaseView", "salaryRelease"], { salaryReleaseView: "View", salaryRelease: "Add / Update" }],
        ];
        return <PermissionRow key={key} itemKey={key} label={label} moduleActions={["view"]} actionLabels={{ view: "View History" }} value={recordValue} onChange={updateRecordPermissions} children={recordChildren} childValues={Object.fromEntries(recordChildren.map(([childKey]) => [childKey, recordValue]))} onChildChange={(_, next) => updateRecordPermissions(next)} />;
      }

      if ([...employeeRecordPermissionKeys, "employeeDocuments", "employeeSecurity", "leaveActions", "leaveDrafts", "profilePersonal", "profileWork", "profileSalary", "profileBank", "profileDocuments"].includes(key)) return null;
      if (key === "documents" && modules.some(([moduleKey]) => moduleKey === "employees")) return null;
      const children = key === "employees" ? modules.filter(([childKey]) => ["employeeDocuments", "employeeSecurity", "documents"].includes(childKey)) : key === "leaves" ? modules.filter(([childKey]) => childKey === "leaveDrafts") : key === "leaveReports" ? modules.filter(([childKey]) => childKey === "leaveActions") : key === "profile" ? modules.filter(([childKey]) => ["profilePersonal", "profileWork", "profileSalary", "profileBank", "profileDocuments"].includes(childKey)) : [];
      return <PermissionRow key={key} itemKey={key} label={label} moduleActions={moduleActions || actions} actionLabels={actionLabels} value={value[key] || {}} onChange={(next) => onChange(key, next)} children={children} childValues={Object.fromEntries(children.map(([childKey]) => [childKey, value[childKey] || {}]))} onChildChange={(childKey, next) => { onChange(childKey, next); if (key === "employees" && next.view === true) onChange("employees", { ...(value.employees || {}), view: true }); }} />;
    })}
  </div>
);

const PermissionRow = ({ itemKey, label, moduleActions, actionLabels, value, onChange, children = [], childValues = {}, onChildChange }) => {
  const [expanded, setExpanded] = useState(false);
  const collapsible = children.length > 0;
  const documentControls = itemKey === "documents" && moduleActions.length > 3;
  const toggle = () => { if (collapsible) setExpanded((current) => !current); };
  const controls = <div onClick={(event) => event.stopPropagation()} className={`${documentControls ? "grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-3 gap-2" : "flex flex-wrap items-center justify-end gap-x-4 gap-y-2"} min-w-0 max-w-full text-xs font-medium text-gray-800 dark:text-gray-100`}>{moduleActions.map((action) => <label key={action} className={`inline-flex min-w-0 items-center gap-2 ${documentControls ? "rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 dark:border-gray-700 dark:bg-gray-800" : "shrink-0 whitespace-nowrap"}`}><input type="checkbox" checked={Boolean(value[action])} onChange={(e) => onChange({ ...value, [action]: e.target.checked, ...(action !== "view" && e.target.checked ? { view: true } : {}), ...(action === "view" && !e.target.checked && employeeRecordPermissionKeys.includes(itemKey) ? Object.fromEntries(moduleActions.map((key) => [key, false])) : {}) })} className="shrink-0 accent-[#f84525]" /> <span>{actionLabels[action] || action[0].toUpperCase() + action.slice(1)}</span></label>)}</div>;
  const childHint = itemKey === "employeeRecordGroup" ? "review and lifecycle permissions" : itemKey === "leaves" ? "leave permissions" : itemKey === "leaveReports" ? "action permissions" : itemKey === "profile" ? "profile field permissions" : "employee permissions";
  return <div>
    <div onClick={toggle} className={`grid ${documentControls ? "grid-cols-1 gap-3 py-4" : "grid-cols-1 lg:grid-cols-[minmax(160px,1fr)_minmax(0,2fr)] items-center gap-3 py-2.5"} px-3 ${collapsible ? "cursor-pointer bg-gray-50/70 dark:bg-gray-800/40" : ""}`}>
      {collapsible ? <button type="button" aria-expanded={expanded} onClick={(event) => { event.stopPropagation(); toggle(); }} className="inline-flex min-w-0 items-center gap-2 rounded-md px-2 py-1 text-left text-sm font-semibold transition hover:bg-gray-100 dark:hover:bg-gray-700"><span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded border border-gray-300 bg-white text-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300">{expanded ? <FiChevronDown /> : <FiChevronRight />}</span><span className="whitespace-nowrap">{label}</span><span className="whitespace-nowrap text-xs font-normal text-gray-500">{expanded ? `Hide ${childHint}` : `Show ${childHint}`}</span></button> : <span className="whitespace-nowrap text-sm font-medium">{label}</span>}
      {controls}
    </div>
    {collapsible && expanded && <div className="divide-y divide-gray-200 border-t border-gray-200 bg-white pl-10 pr-3 dark:divide-gray-700 dark:border-gray-700 dark:bg-gray-900">{children.map(([childKey, childLabel, childActions, childLabels = {}]) => <PermissionRow key={childKey} itemKey={childKey} label={childLabel} moduleActions={childActions} actionLabels={childLabels} value={childValues[childKey]} onChange={(next) => onChildChange(childKey, next)} />)}</div>}
  </div>;
};
export default ModulePermissionMatrix;
