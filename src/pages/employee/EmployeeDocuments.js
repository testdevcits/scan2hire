import { useEffect, useState } from "react";
import { useApi } from "../../contexts/ApiContext";
import Button from "../../components/common/Button";
import CommonLoader from "../../components/common/CommonLoader";
import DocumentSigningList from "../../components/documents/DocumentSigningList";
import PersonalDocuments from "../../components/documents/PersonalDocuments";
export default function EmployeeDocuments() {
  const { employeeApi } = useApi();
  const [section, setSection] = useState("company"),
    [access, setAccess] = useState(null);
  useEffect(() => {
    employeeApi
      .getProfile()
      .then((res) => {
        const permissions = res.data.data?.moduleAccess || {};
        setAccess(permissions);
        if (permissions.documents?.view !== true) setSection("personal");
      })
      .catch(() => setAccess({}));
  }, [employeeApi]);
  if (!access) return <CommonLoader text="Loading document access…" />;
  const company = access.documents?.view === true,
    personal = access.profileDocuments?.view === true;
  return (
    <div className="space-y-5">
      <section className="rounded-sm bg-white p-4 shadow-sm">
        <h1 className="text-xl font-bold">My Documents</h1>
        <p className="mt-1 text-sm text-gray-500">
          Sign company documents and submit personal files for review.
        </p>
        <div className="mt-3 flex gap-2">
          {company && (
            <Button
              text="Company Documents"
              variant={section === "company" ? "primary" : "secondary"}
              onClick={() => setSection("company")}
            />
          )}
          {personal && (
            <Button
              text="Personal Documents"
              variant={section === "personal" ? "primary" : "secondary"}
              onClick={() => setSection("personal")}
            />
          )}
        </div>
      </section>
      {section === "company" && company ? (
        <DocumentSigningList moduleAccess={access} />
      ) : personal ? (
        <PersonalDocuments />
      ) : (
        <p className="rounded border bg-white p-5 text-sm text-gray-500">
          Document access is disabled. Contact your administrator.
        </p>
      )}
    </div>
  );
}
