export const employmentDocumentFields = [["offerLetter", "Offer Letter"], ["experienceLetter", "Experience Letter"]];
export const lastCompanyDocumentFields = [...employmentDocumentFields, ["bankStatement", "Bank Statement (Last 3 Months)"], ["salarySlips", "Salary Slips (Last 3 Months)"]];
export const newEmployment = (isLastCompany = false) => ({ id: crypto.randomUUID(), companyName: "", designation: "", joiningDate: "", leavingDate: "", isLastCompany, documents: {} });
export const experienceError = (form, documents = true) => {
  if (form.experienceType !== "Experienced") return "";
  if (!Number.isFinite(Number(form.totalExperienceYears)) || Number(form.totalExperienceYears) <= 0) return "Enter total experience greater than zero.";
  const companies = form.previousEmployments || [];
  if (!companies.length) return "Add at least one previous company.";
  if (companies.filter((item) => item.isLastCompany).length !== 1) return "Select one last company.";
  for (const company of companies) {
    if (!company.companyName?.trim() || !company.designation?.trim() || !company.joiningDate || !company.leavingDate || company.leavingDate < company.joiningDate) return "Enter company name, designation and valid joining/leaving dates for every company.";
    if (documents && company.isLastCompany && !company.documents?.bankStatement?.dataUri && !company.documents?.bankStatement?.url && !company.documents?.salarySlips?.length) return `${company.companyName}: upload Bank Statement OR Salary Slips (Last 3 Months).`;
    if (documents) for (const [key, label] of company.isLastCompany ? lastCompanyDocumentFields : employmentDocumentFields) {
      const file = company.documents?.[key];
      if ((key === "bankStatement" && !file) || (key === "salarySlips" && !file?.length)) continue;
      if (key === "salarySlips" ? !file?.length : !file?.dataUri && !file?.url) return `${company.companyName}: upload ${label}.`;
      if (key === "salarySlips" && file.length !== 1 && file.some((item) => item.dataUri)) return `${company.companyName}: upload the last 3 months salary slips as one combined PDF.`;
      if (key === "salarySlips" || key === "bankStatement") {
        const files = key === "salarySlips" ? file : [file];
        if (files.some((item) => item.dataUri && !item.dataUri.startsWith("data:application/pdf;"))) return `${company.companyName}: ${label} must be a PDF.`;
      }
    }
  }
  const last = companies.find((item) => item.isLastCompany);
  return companies.some((item) => item.leavingDate > last.leavingDate) ? "Select the most recent company as the last company." : "";
};
