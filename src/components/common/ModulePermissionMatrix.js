const ModulePermissionMatrix = ({ modules, value, onChange, actions = ["view", "edit"] }) => (
  <div className="divide-y rounded border border-gray-200 dark:border-gray-700">
    {modules.map(([key, label, moduleActions, actionLabels = {}]) => <div key={key} className="flex items-center justify-between gap-4 px-3 py-3"><span className="text-sm font-medium">{label}</span><div className="flex flex-wrap gap-5 text-sm">{(moduleActions || actions).map((action) => <label key={action} className="flex items-center gap-2"><input type="checkbox" checked={Boolean(value[key]?.[action])} onChange={(e) => onChange(key, { ...value[key], [action]: e.target.checked, ...(action !== "view" && e.target.checked ? { view: true } : {}) })} className="accent-[#f84525]" /> {actionLabels[action] || action[0].toUpperCase() + action.slice(1)}</label>)}</div></div>)}
  </div>
);
export default ModulePermissionMatrix;
