const SectionHeader = ({ title, subtitle, className = "" }) => (
  <div className={`mb-4 ${className}`}>
    <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
    {subtitle ? <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{subtitle}</p> : null}
  </div>
);

export default SectionHeader;
