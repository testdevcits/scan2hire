import { fireEvent, render, screen, within } from "@testing-library/react";
import EmployeeDocumentHistory from "./EmployeeDocumentHistory";
import { hrApi } from "../../../services/api";
jest.mock("../../../services/api", () => ({ hrApi: { getEmployeeDocumentVersions: jest.fn() } }));
const employee = { _id: "employee" };
test("admin sees old and latest photo versions and opens the selected old copy", async () => {
  hrApi.getEmployeeDocumentVersions.mockResolvedValue({
    data: {
      data: [
        {
          documentKey: "photo",
          version: 1,
          isLatest: false,
          file: { url: "old.jpg", name: "old.jpg" },
        },
        {
          documentKey: "photo",
          version: 2,
          isLatest: true,
          file: { url: "new.jpg", name: "new.jpg" },
        },
      ],
    },
  });
  const onView = jest.fn();
  render(
    <EmployeeDocumentHistory
      employee={employee}
      documentItems={[["photo", "Employee Photo"]]}
      onView={onView}
      canDownload={false}
    />
  );
  const old = await screen.findByText("v1 · Old");
  expect(screen.getByText("v2 · Latest")).toBeTruthy();
  fireEvent.click(within(old.closest("tr")).getByText("View"));
  expect(onView).toHaveBeenCalledWith(
    expect.objectContaining({ url: "old.jpg", label: "Employee Photo · v1" })
  );
  expect(screen.queryByText("Download")).toBeNull();
});
test("failed history request shows retry instead of an empty history", async () => {
  hrApi.getEmployeeDocumentVersions.mockRejectedValue(new Error("failed"));
  render(<EmployeeDocumentHistory employee={employee} documentItems={[]} />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Unable to load document versions");
  expect(screen.getByText("Retry")).toBeTruthy();
});
