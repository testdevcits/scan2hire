import { inputSizes } from "./inputSizes";
import { inputVariants } from "./inputVariants";

const shapes = { square: "rounded-sm", rounded: "rounded-md", pill: "rounded-full", none: "" };

export const resolveInputClasses = ({
  variant = "default",
  size = "md",
  shape = "square",
  error = false,
  hasLeftIcon = false,
  hasRightIcon = false,
  className = "",
}) => {
  const isUnstyled = variant === "unstyled";
  return [
    "w-full min-w-0 transition-colors placeholder:text-gray-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60",
    !isUnstyled && inputVariants[variant],
    !isUnstyled && inputSizes[size],
    !isUnstyled && shapes[shape],
    error && "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100",
    hasLeftIcon && "pl-10",
    hasRightIcon && "pr-10",
    className,
  ].filter(Boolean).join(" ");
};

export const inputShapes = shapes;
export { inputSizes, inputVariants };
