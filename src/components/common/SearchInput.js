import { FiSearch, FiX } from "react-icons/fi";

const SearchInput = ({ value, onChange, placeholder = "Search...", label, className = "", inputClassName = "" }) => (
  <label className={`relative block ${className}`}>
    {label && <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">{label}</span>}
    <span className="relative block">
      <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        inputMode="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`min-h-10 w-full rounded-sm border border-gray-300 bg-white py-2 pl-9 pr-9 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#f84525] focus:ring-2 focus:ring-[#f84525]/10 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 ${inputClassName}`}
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-[#f84525]"
        >
          <FiX className="h-4 w-4" />
        </button>
      )}
    </span>
  </label>
);

export default SearchInput;
