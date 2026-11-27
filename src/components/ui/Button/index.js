import React from "react";
import Button from "./button";

export { default as DynamicButton } from "./button";
export { Button } from "./button";
export { buttonSizes } from "./buttonSizes";
export { buttonVariants } from "./buttonVariants";
export { buttonShapes, resolveButtonClasses } from "./buttonConfig";

export const StyledButton = React.forwardRef(({ buttonStyle, variant, ...props }, ref) => (
  <Button ref={ref} variant={variant || buttonStyle || "primary"} {...props} />
));
StyledButton.displayName = "StyledButton";

export const ButtonWithIcon = React.forwardRef(({ icon, leftIcon = icon, ...props }, ref) => (
  <Button ref={ref} leftIcon={leftIcon} {...props} />
));
ButtonWithIcon.displayName = "ButtonWithIcon";

export { default } from "./button";
