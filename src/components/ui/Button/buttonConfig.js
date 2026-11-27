const shapes = {
  square: "rounded-sm",
  rounded: "rounded-md",
  pill: "rounded-full",
  none: "",
};

const join = (...parts) => parts.filter(Boolean).join(" ");

export const resolveButtonClasses = ({
  variant = "primary",
  size = "md",
  shape = "square",
  className = "",
  buttonVariants = {},
  buttonSizes = {},
}) => {
  const isUnstyled = variant === "unstyled";
  const isLink = variant === "link";
  return join(
    !isUnstyled && "group inline-flex items-center justify-center whitespace-nowrap align-middle font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f84525] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
    buttonVariants[variant] ?? buttonVariants.primary,
    size !== "none" && !isUnstyled && buttonSizes[size],
    !isLink && shapes[shape],
    className,
  );
};

export const buttonShapes = shapes;
