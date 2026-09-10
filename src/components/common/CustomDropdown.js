import { useEffect, useMemo, useRef, useState } from "react";
import { FiChevronDown, FiSearch, FiX } from "react-icons/fi";

const normalizeOption = (option) =>
  typeof option === "string"
    ? { label: option, value: option }
    : { label: option.label || option.value || "", value: option.value || option.label || "" };

const CustomDropdown = ({
  label,
  value,
  options = [],
  onChange,
  placeholder = "Select",
  disabled = false,
  required = false,
  searchable = true,
  error = "",
  className = "",
}) => {
  const wrapperRef = useRef(null);
  const searchRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const normalizedOptions = useMemo(() => options.map(normalizeOption), [options]);
  const selectedOption = normalizedOptions.find((option) => String(option.value) === String(value));
  const displayValue = selectedOption?.label || value || "";

  const filteredOptions = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return normalizedOptions;
    return normalizedOptions.filter((option) =>
      String(option.label || option.value).toLowerCase().includes(term)
    );
  }, [normalizedOptions, search]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setOpen(false);
        setSearch("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open && searchable) {
      window.setTimeout(() => searchRef.current?.focus(), 0);
    }
  }, [open, searchable]);

  const selectOption = (nextValue) => {
    onChange?.(nextValue);
    setOpen(false);
    setSearch("");
  };

  return (
    <label ref={wrapperRef} className={`relative block text-sm font-medium ${className}`}>
      {label ? (
        <span>
          {label} {required && <span className="text-red-500">*</span>}
        </span>
      ) : null}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        className={`mt-1 flex min-h-[38px] w-full items-center justify-between gap-2 rounded-sm border bg-white px-3 py-2 text-left text-sm text-gray-900 transition-colors focus:border-[#f84525] focus:outline-none focus:ring-2 focus:ring-[#f84525]/10 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 ${
          error ? "border-red-500" : "border-gray-300"
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={`min-w-0 truncate ${displayValue ? "text-gray-900" : "text-gray-400"}`}>
          {displayValue || placeholder}
        </span>
        <FiChevronDown className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && !disabled && (
        <div className="absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-md border border-gray-200 bg-white shadow-xl">
          {searchable && (
            <div className="relative border-b border-gray-100 p-2">
              <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                ref={searchRef}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-sm border border-gray-200 py-2 pl-9 pr-8 text-sm focus:border-[#f84525] focus:outline-none focus:ring-2 focus:ring-[#f84525]/10"
                placeholder="Search"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-sm p-1 text-gray-400 hover:text-gray-700"
                  aria-label="Clear search"
                >
                  <FiX />
                </button>
              )}
            </div>
          )}
          <div className="max-h-60 overflow-y-auto py-1" role="listbox">
            <button
              type="button"
              onClick={() => selectOption("")}
              className={`block w-full px-3 py-2 text-left text-sm hover:bg-[#fff5f3] hover:text-[#f84525] ${
                !value ? "bg-[#fff5f3] font-semibold text-[#f84525]" : "text-gray-500"
              }`}
            >
              {placeholder}
            </button>
            {filteredOptions.length === 0 ? (
              <p className="px-3 py-3 text-sm text-gray-500">No options found</p>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => selectOption(option.value)}
                  className={`block w-full px-3 py-2 text-left text-sm hover:bg-[#fff5f3] hover:text-[#f84525] ${
                    String(value) === String(option.value) ? "bg-[#fff5f3] font-semibold text-[#f84525]" : "text-gray-700"
                  }`}
                  role="option"
                  aria-selected={String(value) === String(option.value)}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
      {error ? <span className="mt-1 block text-xs text-red-500">{error}</span> : null}
    </label>
  );
};

export default CustomDropdown;
