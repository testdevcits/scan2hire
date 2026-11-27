import Avatar from "../../../components/ui/Avatar";

/** Clickable profile tile for employee, HR, and candidate card views. */
const ProfileCard = ({ name, image, subtitle, onClick, className = "", coverClassName = "" }) => (
  <button
    type="button"
    onClick={onClick}
    className={`group overflow-hidden rounded-sm border border-[#f7a08f] bg-white text-left shadow-sm transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f84525] dark:bg-gray-900 ${className}`}
  >
    <div
      className={`relative aspect-[4/3.4] overflow-hidden bg-gradient-to-br from-[#2d2a33] via-[#3e3440] to-[#18171d] ${coverClassName}`}
    >
      <Avatar
        name={name}
        src={image}
        alt={name}
        size="h-full w-full"
        className="rounded-none border-0 bg-transparent text-3xl text-white transition-transform group-hover:scale-[1.02]"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-1 rounded-sm border border-[#f84525]"
      />
    </div>
    <div className="border-t border-[#f7a08f] p-2 text-center">
      <p className="truncate text-[13px] font-semibold text-gray-900 dark:text-gray-100">
        {name || "Unknown"}
      </p>
      {subtitle && (
        <p className="mt-0.5 truncate text-[11px] text-gray-500 dark:text-gray-400">{subtitle}</p>
      )}
    </div>
  </button>
);

export default ProfileCard;
