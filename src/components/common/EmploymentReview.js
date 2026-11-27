import { employmentDocumentFields, lastCompanyDocumentFields } from "../../utils/employmentFields";

export default function EmploymentReview({ companies = [] }) {
  if (!companies.length) return <p>None</p>;
  return (
    <div className="space-y-5">
      {companies.map((company, index) => (
        <section key={company.id || index} className="space-y-2">
          <h4 className="font-semibold">
            {company.companyName || `Company ${index + 1}`}{" "}
            {company.isLastCompany ? "(Last company)" : ""}
          </h4>
          <p className="text-gray-600 dark:text-gray-400">
            {company.designation || "Not provided"} · {company.joiningDate || "Not provided"} –{" "}
            {company.leavingDate || "Not provided"}
          </p>
          <dl className="space-y-2">
            {(company.isLastCompany ? lastCompanyDocumentFields : employmentDocumentFields).map(
              ([key, label]) => (
                <div key={key} className="grid gap-1 sm:grid-cols-[200px_minmax(0,1fr)]">
                  <dt className="font-medium text-gray-600 dark:text-gray-400">{label}</dt>
                  <dd className="min-w-0 break-words">
                    {key === "salarySlips"
                      ? company.documents?.[key]
                          ?.map((file) => file.name || "Uploaded file")
                          .join(", ") || "Not uploaded"
                      : company.documents?.[key]?.name || "Not uploaded"}
                  </dd>
                </div>
              )
            )}
          </dl>
        </section>
      ))}
    </div>
  );
}
