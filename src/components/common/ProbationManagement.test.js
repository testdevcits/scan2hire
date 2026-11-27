import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ProbationManagement from "./ProbationManagement";
const mockPatch = jest.fn();
const mockSuccess = jest.fn();
jest.mock("../../contexts/ApiContext", () => ({ useApi: () => ({ API: { patch: mockPatch } }) }));
jest.mock("../../contexts/ToastContext", () => ({
  useToast: () => ({ success: mockSuccess, error: jest.fn() }),
}));
const employee = {
  _id: "employee-1",
  probation: { required: true, expectedEndDate: "2026-10-20", status: "awaiting_confirmation" },
};
test("probation actions are hidden without management permission", () => {
  render(<ProbationManagement employee={employee} canManage={false} />);
  expect(screen.queryByRole("button", { name: "Confirm Employee" })).toBeNull();
  expect(screen.getByText("Pending HR confirmation")).toBeTruthy();
});
test("confirmation sends date and reason to the probation endpoint", async () => {
  mockPatch.mockResolvedValue({ data: { message: "Confirmed" } });
  const onChanged = jest.fn();
  render(<ProbationManagement employee={employee} canManage onChanged={onChanged} />);
  fireEvent.click(screen.getByRole("button", { name: "Confirm Employee" }));
  fireEvent.change(screen.getByLabelText("Actual confirmation date"), {
    target: { value: "2026-10-20" },
  });
  fireEvent.change(screen.getByLabelText("Reason"), { target: { value: "Assessment complete" } });
  fireEvent.click(screen.getByRole("button", { name: "Save" }));
  await waitFor(() => expect(onChanged).toHaveBeenCalled());
  expect(mockPatch).toHaveBeenCalledWith("/hr/employees/employee-1/probation", {
    action: "confirm",
    effectiveDate: "2026-10-20",
    reason: "Assessment complete",
  });
});
