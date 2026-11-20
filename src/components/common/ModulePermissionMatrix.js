import { useState } from "react";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";

const ModulePermissionMatrix = ({ modules, value, onChange, actions = ["view", "edit"] }) => (
  <div className="divide-y rounded border border-gray-200 dark:border-gray-700">
    {modules.map((item, index) => {
      const [key, label, moduleActions, actionLabels = {}] = item;
      if (["employeeDocuments", "employeeSecurity", "documents", "leaveActions"].includes(key)) return null;
      const children = key === "employees" ? modules.filter(([childKey]) => ["employeeDocuments", "employeeSecurity", "documents"].includes(childKey)) : key === "leaveReports" ? modules.filter(([childKey]) => childKey === "leaveActions") : [];
      return <PermissionRow key={key} itemKey={key} label={label} moduleActions={moduleActions || actions} actionLabels={actionLabels} value={value[key] || {}} onChange={(next) => onChange(key, next)} children={children} childValues={Object.fromEntries(children.map(([childKey]) => [childKey, value[childKey] || {}]))} onChildChange={(childKey, next) => onChange(childKey, next)} />;
    })}
  </div>
);

const PermissionRow = ({ itemKey, label, moduleActions, actionLabels, value, onChange, children = [], childValues = {}, onChildChange }) => {
  const [expanded, setExpanded] = useState(false);
  const collapsible = children.length > 0;
  const toggle = () => { if (collapsible) setExpanded((current) => !current); };
  const controls = <div onClick={(event) => event.stopPropagation()} className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs font-medium text-gray-800 dark:text-gray-100">{moduleActions.map((action) => <label key={action} className="inline-flex items-center gap-1.5 whitespace-nowrap"><input type="checkbox" checked={Boolean(value[action])} onChange={(e) => onChange({ ...value, [action]: e.target.checked, ...(action !== "view" && e.target.checked ? { view: true } : {}) })} className="accent-[#f84525]" /> <span>{actionLabels[action] || action[0].toUpperCase() + action.slice(1)}</span></label>)}</div>;
  return <div>
    <div onClick={toggle} className={`flex items-center justify-between gap-4 px-3 py-2.5 ${collapsible ? "cursor-pointer bg-gray-50/70 dark:bg-gray-800/40" : ""}`}>
      {collapsible ? <button type="button" aria-expanded={expanded} onClick={(event) => { event.stopPropagation(); toggle(); }} className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-left text-sm font-semibold transition hover:bg-gray-100 dark:hover:bg-gray-700"><span className="inline-flex h-6 w-6 items-center justify-center rounded border border-gray-300 bg-white text-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300">{expanded ? <FiChevronDown /> : <FiChevronRight />}</span><span>{label}</span><span className="text-xs font-normal text-gray-500">{expanded ? "Hide employee permissions" : "Show employee permissions"}</span></button> : <span className="text-sm font-medium">{label}</span>}
      {controls}
    </div>
    {collapsible && expanded && <div className="divide-y divide-gray-200 border-t border-gray-200 bg-white pl-10 pr-3 dark:divide-gray-700 dark:border-gray-700 dark:bg-gray-900">{children.map(([childKey, childLabel, childActions, childLabels = {}]) => <PermissionRow key={childKey} itemKey={childKey} label={childLabel} moduleActions={childActions} actionLabels={childLabels} value={childValues[childKey]} onChange={(next) => onChildChange(childKey, next)} />)}</div>}
  </div>;
};
export default ModulePermissionMatrix;
