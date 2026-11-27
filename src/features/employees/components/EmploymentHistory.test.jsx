import { useState } from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import EmploymentHistory from "./EmploymentHistory";
import { experienceError } from "../utils/employmentFields";

const companies = [
  { id: "a", companyName: "Company A", documents: {}, isLastCompany: false },
  { id: "b", companyName: "Company B", documents: {}, isLastCompany: true },
];

test("fresher has no previous-company fields", () => {
  render(
    <EmploymentHistory form={{ experienceType: "Fresher", previousEmployments: companies }} />
  );
  expect(screen.queryByText("Previous Companies")).toBeNull();
});

test("last company gets extra upload fields and older company only two", () => {
  render(
    <EmploymentHistory
      documents
      form={{ experienceType: "Experienced", previousEmployments: companies }}
      onFiles={jest.fn()}
    />
  );
  expect(screen.getAllByText("Offer Letter *")).toHaveLength(2);
  expect(screen.getAllByText("Experience Letter *")).toHaveLength(2);
  expect(screen.getAllByText("Bank Statement (Last 3 Months)")).toHaveLength(1);
  expect(screen.getAllByText("Salary Slips (Last 3 Months)")).toHaveLength(1);
});

test("selecting last company preserves company-linked files", () => {
  const initial = {
    experienceType: "Experienced",
    previousEmployments: [
      { ...companies[0], documents: { offerLetter: { name: "a.pdf" } } },
      companies[1],
    ],
  };
  function Harness() {
    const [form, setForm] = useState(initial);
    return (
      <>
        <EmploymentHistory form={form} setForm={setForm} />
        <output>{JSON.stringify(form.previousEmployments)}</output>
      </>
    );
  }
  render(<Harness />);
  fireEvent.click(screen.getAllByRole("radio")[0]);
  const result = JSON.parse(screen.getByRole("status").textContent);
  expect(result[0].isLastCompany).toBe(true);
  expect(result[1].isLastCompany).toBe(false);
  expect(result[0].documents.offerLetter.name).toBe("a.pdf");
});

test("experience validation ignores stale files for fresher and requires company data for experienced", () => {
  expect(experienceError({ experienceType: "Fresher" })).toBe("");
  expect(
    experienceError({
      experienceType: "Experienced",
      totalExperienceYears: 2,
      previousEmployments: [],
    })
  ).toMatch(/previous company/);
});

test("bank and salary single PDF fields move to the selected last company", () => {
  function Harness() {
    const [form, setForm] = useState({
      experienceType: "Experienced",
      previousEmployments: companies,
    });
    return <EmploymentHistory documents form={form} setForm={setForm} onFiles={jest.fn()} />;
  }
  render(<Harness />);
  const first = screen.getByRole("heading", { name: "Company A" }).closest("section");
  expect(within(first).queryByText("Bank Statement (Last 3 Months)")).toBeNull();
  fireEvent.click(within(first).getByRole("radio"));
  expect(within(first).getByText("Bank Statement (Last 3 Months)")).toBeTruthy();
  const second = screen.getByRole("heading", { name: "Company B" }).closest("section");
  expect(within(second).queryByText("Salary Slips (Last 3 Months)")).toBeNull();
  const pdfInputs = first.querySelectorAll('input[type="file"][accept=".pdf"]');
  expect(pdfInputs).toHaveLength(2);
  expect(pdfInputs[0].multiple).toBe(false);
  expect(pdfInputs[1].multiple).toBe(true);
});
