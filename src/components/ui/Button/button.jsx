import React from "react";
import { FiLoader } from "react-icons/fi";
import { buttonSizes } from "./buttonSizes";
import { buttonVariants } from "./buttonVariants";
import { buttonShapes, resolveButtonClasses } from "./buttonConfig";

export { buttonSizes, buttonVariants, buttonShapes, resolveButtonClasses };

const DynamicButton = React.forwardRef(({
  text,
  children,
  onClick,
  className = "",
  disabled = false,
  loading = false,
  type = "button",
  form,
  variant = "primary",
  size = "md",
  shape = "square",
  title,
  leftIcon,
  rightIcon,
  ...props
}, ref) => (
  <button
    ref={ref}
    type={type}
    form={form}
    onClick={onClick}
    disabled={disabled || loading}
    title={title}
    className={resolveButtonClasses({ variant, size, shape, className, buttonVariants, buttonSizes })}
    {...props}
  >
    {loading ? <FiLoader className="animate-spin" aria-hidden="true" /> : leftIcon}
    {loading ? text || "Processing..." : children || text}
    {!loading && rightIcon}
  </button>
));

DynamicButton.displayName = "DynamicButton";
export const Button = DynamicButton;
export default DynamicButton;
