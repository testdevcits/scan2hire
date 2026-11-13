const ViewSwitcher = ({ options, value, onChange, className = "" }) => (
  <div className={`inline-flex rounded-sm border border-[#ffd8cf] bg-white p-1 dark:border-gray-700 dark:bg-gray-900 ${className}`} role="group">
    {options.map(({ value: optionValue, label, icon: Icon }) => {
      const active = optionValue === value;
      return (
        <button
          key={optionValue}
          type="button"
          aria-pressed={active}
          onClick={() => onChange(optionValue)}
          className={`inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-sm transition-colors ${active ? "bg-[#f84525] text-white" : "text-gray-600 hover:text-[#f84525] dark:text-gray-300"}`}
        >
          {Icon && <Icon aria-hidden="true" className="h-4 w-4" />}
          {label}
        </button>
      );
    })}
  </div>
);

export default ViewSwitcher;
