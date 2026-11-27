import { FiSearch, FiX } from "react-icons/fi";
import { resolveInputClasses } from "./inputConfig";

const SearchInput = ({
  value,
  onChange,
  placeholder = "Search...",
  label,
  className = "",
  inputClassName = "",
  size = "md",
  variant = "default",
  shape = "square",
}) => (
  <label className={`relative block ${className}`}>
    {label && (
      <span className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-200">
        {label}
      </span>
    )}
    <span className="relative block">
      <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        inputMode="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={resolveInputClasses({
          variant,
          size,
          shape,
          className: `w-full pl-9 pr-9 ${inputClassName}`,
        })}
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
