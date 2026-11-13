const getInitials = (name = "") => String(name)
  .trim()
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map((part) => part[0].toUpperCase())
  .join("") || "?";

const Avatar = ({ name, src, size = "h-9 w-9", className = "", alt }) => (
  <span className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-orange-100 bg-orange-50 text-xs font-semibold text-[#f84525] dark:border-gray-700 dark:bg-gray-800 dark:text-orange-300 ${size} ${className}`}>
    <span aria-hidden="true">{getInitials(name)}</span>
    {src && (
      <img
        src={src}
        alt={alt || ""}
        loading="lazy"
        decoding="async"
        onError={(event) => event.currentTarget.remove()}
        className="absolute inset-0 h-full w-full object-cover"
      />
    )}
  </span>
);

export default Avatar;
