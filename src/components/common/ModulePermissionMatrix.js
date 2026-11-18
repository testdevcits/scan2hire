const ModulePermissionMatrix = ({ modules, value, onChange }) => (
  <div className="divide-y rounded border border-gray-200 dark:border-gray-700">
    {modules.map(([key, label]) => <div key={key} className="flex items-center justify-between gap-4 px-3 py-3"><span className="text-sm font-medium">{label}</span><div className="flex gap-5 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(value[key]?.view)} onChange={(e) => onChange(key, { ...value[key], view: e.target.checked })} className="accent-[#f84525]" /> View</label><label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(value[key]?.edit)} onChange={(e) => onChange(key, { ...value[key], edit: e.target.checked, view: true })} className="accent-[#f84525]" /> Edit</label></div></div>)}
  </div>
);
export default ModulePermissionMatrix;
