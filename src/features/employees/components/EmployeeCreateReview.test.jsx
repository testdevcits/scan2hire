import { render, screen, within } from "@testing-library/react";
import EmployeeCreateReview from "./EmployeeCreateReview";
import { employeeCreateDocumentFields } from "../../documents/utils/employeeDocumentFields";

test("review lists every upload field even when no files are selected", () => {
  render(<EmployeeCreateReview form={{}} onEdit={jest.fn()} />);
  const section = screen.getByRole("heading", { name: "Step 5: Documents" }).closest("section");
  expect(employeeCreateDocumentFields).toHaveLength(10);
  for (const [, label] of employeeCreateDocumentFields) {
    const row = within(section).getByText(label).closest("div");
    expect(within(row).getByText("Not uploaded")).toBeTruthy();
  }
  expect(within(section).getByText("Employee Photo")).toBeTruthy();
  expect(within(section).queryByText("Previous Employment")).toBeNull();
});

test("review maps each previous company document and salary slip", () => {
  render(
    <EmployeeCreateReview
      form={{
        experienceType: "Experienced",
        previousEmployments: [
          {
            id: "last",
            companyName: "Company B",
            isLastCompany: true,
            documents: {
              bankStatement: { name: "statement.pdf" },
              salarySlips: [{ name: "january.pdf" }, { name: "february.pdf" }],
            },
          },
        ],
      }}
      onEdit={jest.fn()}
    />
  );
  const section = screen.getByRole("heading", { name: "Step 5: Documents" }).closest("section");
  expect(within(section).getByText("statement.pdf")).toBeTruthy();
  expect(within(section).getByText("january.pdf, february.pdf")).toBeTruthy();
});
