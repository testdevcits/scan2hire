import { fireEvent, render, screen } from "@testing-library/react";
import CalendarPicker from "./CalendarPicker";

test("year mode shows and returns only the selected year", () => {
  const onChange = jest.fn();
  render(<CalendarPicker label="Passing Year" mode="year" value="2024" onChange={onChange} />);
  fireEvent.click(screen.getByRole("button", { name: "2024" }));
  expect(screen.queryByRole("combobox", { name: "Month" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "2023" }));
  fireEvent.click(screen.getByRole("button", { name: "Apply" }));
  expect(onChange).toHaveBeenCalledWith("2023");
});

test("year selection can navigate to older years and clear", () => {
  const onChange = jest.fn();
  render(<CalendarPicker mode="year" value="2024" onChange={onChange} />);
  fireEvent.click(screen.getByRole("button", { name: "2024" }));
  fireEvent.click(screen.getByRole("button", { name: "Previous years" }));
  expect(screen.getByRole("button", { name: "2012" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Clear" }));
  expect(onChange).toHaveBeenCalledWith("");
});
