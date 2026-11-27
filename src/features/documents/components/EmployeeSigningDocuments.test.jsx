import { render, screen } from "@testing-library/react";
import EmployeeSigningDocuments from "./EmployeeSigningDocuments";
const props = {
  documents: [
    { _id: "1", type: "appointment_letter", status: "pending", signedPages: [], pageCount: 2 },
  ],
  onRefresh: jest.fn(),
  onOpen: jest.fn(),
  onDownload: jest.fn(),
};
test("view-only employees can read without signing or downloading", () => {
  render(<EmployeeSigningDocuments {...props} />);
  expect(screen.getByRole("button", { name: "View PDF" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "View & Sign" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Download PDF" })).toBeNull();
});
test("sign permission enables the signature workflow", () => {
  render(<EmployeeSigningDocuments {...props} canSign />);
  expect(screen.getByRole("button", { name: "View & Sign" })).toBeTruthy();
});
test("download permission controls submitted copy downloads independently", () => {
  const submitted = {
    ...props,
    documents: [{ ...props.documents[0], status: "awaiting_verification" }],
  };
  const { rerender } = render(<EmployeeSigningDocuments {...submitted} canSign />);
  expect(screen.queryByRole("button", { name: "Download PDF" })).toBeNull();
  rerender(<EmployeeSigningDocuments {...submitted} canDownload />);
  expect(screen.getByRole("button", { name: "Download PDF" })).toBeTruthy();
});
