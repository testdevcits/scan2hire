import { fireEvent, render, screen } from "@testing-library/react";
import FileUploadField from "./FileUploadField";
test("compact uploaded card keeps replacement and saved file actions visible", () => {
  const view = jest.fn();
  const download = jest.fn();
  render(
    <FileUploadField
      compact
      uploaded
      label="Employee Photo"
      name="photo"
      fileName="photo.jpg"
      onPreviewCurrent={view}
      onDownloadCurrent={download}
    />
  );
  expect(screen.getByText("Uploaded")).toBeVisible();
  expect(screen.getByText("Replace")).toBeVisible();
  fireEvent.click(screen.getByText("View"));
  fireEvent.click(screen.getByText("Download"));
  expect(view).toHaveBeenCalledTimes(1);
  expect(download).toHaveBeenCalledTimes(1);
});
test("compact card shows oversize error beside the field without accepting the file", () => {
  const onChange = jest.fn();
  render(<FileUploadField compact label="Resume" name="resume" onChange={onChange} />);
  fireEvent.change(document.querySelector('input[type="file"]'), {
    target: { files: [{ name: "large.pdf", size: 6 * 1024 * 1024 }] },
  });
  expect(screen.getByRole("alert")).toHaveTextContent("large.pdf");
  expect(onChange).not.toHaveBeenCalled();
});
test("view-only access hides replacement and file input while retaining allowed preview", () => {
  render(
    <FileUploadField
      compact
      canUpload={false}
      uploaded
      label="Marksheet"
      name="marksheet"
      fileName="marksheet.pdf"
      onPreviewCurrent={jest.fn()}
    />
  );
  expect(screen.getByText("View")).toBeVisible();
  expect(screen.queryByText("Replace")).toBeNull();
  expect(screen.queryByText("Download")).toBeNull();
  expect(document.querySelector('input[type="file"]')).toBeNull();
});
