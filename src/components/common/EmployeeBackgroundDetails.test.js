import { render, screen } from "@testing-library/react";
import EmployeeBackgroundDetails, { EmployeeChecklistDetails } from "./EmployeeBackgroundDetails";
test("details show saved experience, previous company and qualifications", () => {
  render(
    <EmployeeBackgroundDetails
      employee={{
        experienceType: "Experienced",
        totalExperienceYears: 3,
        previousEmployments: [
          {
            id: "one",
            companyName: "Dollop",
            designation: "Developer",
            joiningDate: "2020-01-01",
            leavingDate: "2023-01-01",
            isLastCompany: true,
          },
        ],
        qualifications: [
          {
            level: "Graduation",
            course: "BTech",
            institute: "Test University",
            passingYear: "2020",
            percentage: 0,
          },
        ],
      }}
    />
  );
  for (const label of [
    "Experienced",
    "3",
    "Dollop",
    "Developer",
    "Last company",
    "BTech",
    "Test University",
    "2020",
    "0",
  ])
    expect(screen.getByText(label)).toBeVisible();
});
test("empty records show explicit messages and checklist is read only", () => {
  render(
    <>
      <EmployeeBackgroundDetails
        employee={{ experienceType: "Fresher", totalExperienceYears: 0 }}
      />
      <EmployeeChecklistDetails employee={{ joiningChecklist: { idCard: true } }} />
    </>
  );
  expect(screen.getByText("No qualifications recorded.")).toBeVisible();
  expect(screen.queryByText("No previous companies recorded.")).toBeNull();
  const checkboxes = screen.getAllByRole("checkbox");
  checkboxes.forEach((checkbox) => expect(checkbox).toBeDisabled());
  expect(checkboxes[0]).toBeChecked();
});
