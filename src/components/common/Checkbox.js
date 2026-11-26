const Checkbox = ({ checked, onChange, disabled = false, label, description, className = '', compact = false }) => (
  <label className={`flex ${compact ? 'items-center' : 'items-start rounded-md border border-gray-200 p-3 dark:border-gray-700'} gap-2 text-sm ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${className}`}>
    <input type="checkbox" checked={Boolean(checked)} disabled={disabled} onChange={event => onChange?.(event.target.checked)} className={`${compact ? '' : 'mt-0.5'} h-4 w-4 shrink-0 accent-[#f84525]`} />
    <span className={compact ? 'flex flex-wrap items-center gap-x-2 gap-y-0.5' : ''}><span className="font-medium">{label}</span>{description && <span className={compact ? 'text-xs text-gray-500' : 'mt-1 block text-xs text-gray-500'}>{description}</span>}</span>
  </label>
);
export default Checkbox;
