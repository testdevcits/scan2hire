const Tabs = ({ tabs = [], value, onChange, label = "Sections" }) => (
  <div
    role="tablist"
    aria-label={label}
    className="flex min-w-0 gap-1 overflow-x-auto border-b border-gray-200 px-1 scrollbar-thin dark:border-gray-700"
  >
    {tabs.map((tab) => {
      const selected = value === tab.value;
      return (
        <button
          key={tab.value}
          id={`${tab.value}-tab`}
          type="button"
          role="tab"
          aria-selected={selected}
          aria-controls={`${tab.value}-panel`}
          onClick={() => onChange(tab.value)}
          className={`-mb-px shrink-0 border-b-2 px-3 py-3 text-sm font-semibold transition-colors sm:px-4 ${selected ? "border-[#f84525] text-[#f84525]" : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"}`}
        >
          {tab.label}
        </button>
      );
    })}
  </div>
);

export default Tabs;
