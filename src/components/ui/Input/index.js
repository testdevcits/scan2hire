import React from "react";
import Input from "./InputField";
import SelectField from "../Select/SelectField";

export { default, default as InputField } from "./InputField";
export { inputSizes } from "./inputSizes";
export { inputVariants } from "./inputVariants";
export { inputShapes, resolveInputClasses } from "./inputConfig";

export const DynamicInput = Input;
export const TextInput = (props) => <Input type="text" {...props} />;

export const EmailInput = (props) => <Input type="email" {...props} />;

export const PasswordInput = (props) => <Input type="password" passwordToggle {...props} />;
export const SelectInput = SelectField;
