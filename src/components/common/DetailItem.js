const DetailItem = ({ icon, label, value, plain = false, className = "" }) => (
  <div className={`min-w-0 ${plain ? "border-b border-gray-100 py-3 dark:border-gray-800" : "rounded-sm border border-gray-100 bg-gray-50 px-3 py-3 dark:border-gray-800 dark:bg-gray-800"} ${className}`}>
    <div className={`flex items-center gap-2 ${plain ? "text-xs font-medium" : "text-xs font-semibold uppercase tracking-wide"} text-gray-500 dark:text-gray-400`}>
      {icon}<span>{label}</span>
    </div>
    <p className="mt-1 break-words text-sm font-semibold text-gray-900 dark:text-gray-100">{value}</p>
  </div>
);

export default DetailItem;
