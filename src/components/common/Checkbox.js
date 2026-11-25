const Checkbox = ({ checked, onChange, disabled = false, label, description, className = '' }) => (
  <label className={`flex items-start gap-2 rounded-md border border-gray-200 p-3 text-sm dark:border-gray-700 ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${className}`}>
    <input type="checkbox" checked={Boolean(checked)} disabled={disabled} onChange={event => onChange?.(event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#f84525]" />
    <span><span className="block font-medium">{label}</span>{description && <span className="mt-1 block text-xs text-gray-500">{description}</span>}</span>
  </label>
);
export default Checkbox;
