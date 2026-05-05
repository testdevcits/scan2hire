import Button from "../../components/common/Button";

const Step3 = ({ formData, qrId, onBack, onSubmit, loading }) => {
  const display = (value) => value || "-";
  const has = (value) => (Array.isArray(value) ? value.length > 0 : Boolean(value));
  const salary = (amount, period) =>
    amount ? `${amount} / ${period === "monthly" ? "month" : "annum"}` : "";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-sm md:text-base">
      <div className="bg-gray-50 p-3 sm:p-4 rounded-sm space-y-1 break-words">
        <h3 className="font-semibold text-base sm:text-lg mb-2">Personal Details</h3>
        <p>
          <b>Name:</b> {display(formData.name)}
        </p>
        <p>
          <b>Qualification:</b>{" "}
          {formData.qualification === "Other"
            ? display(formData.otherQualification)
            : display(formData.qualification)}
        </p>
        {has(formData.branch) && (
          <p>
            <b>Branch:</b> {display(formData.branch)}
          </p>
        )}
        <p>
          <b>Mobile:</b> {display(formData.mobile)}
        </p>
        {has(formData.altMobile) && (
          <p>
            <b>Alt Mobile:</b> {display(formData.altMobile)}
          </p>
        )}
        <p>
          <b>Email:</b> {display(formData.email)}
        </p>
      </div>

      <div className="bg-gray-50 p-3 sm:p-4 rounded-sm space-y-1 break-words">
        <h3 className="font-semibold text-base sm:text-lg mb-2">Job Details</h3>
        <p>
          <b>Experience Type:</b> {display(formData.experienceType)}
        </p>
        <p>
          <b>Experience:</b> {formData.experienceType === "fresher" ? "Fresher" : display(formData.experience)}
        </p>
        {has(formData.currentSalary) && (
          <p>
            <b>Current Salary:</b> {display(salary(formData.currentSalary, formData.currentSalaryPeriod))}
          </p>
        )}
        {has(formData.currentCompany) && (
          <p>
            <b>Current Company:</b> {display(formData.currentCompany)}
          </p>
        )}
        <p>
          <b>Expected Salary:</b> {display(salary(formData.expectedSalary, formData.expectedSalaryPeriod))}
        </p>
      </div>

      <div className="bg-gray-50 p-3 sm:p-4 rounded-sm space-y-1 break-words">
        <h3 className="font-semibold text-base sm:text-lg mb-2">Additional Info</h3>
        <p>
          <b>Resume:</b> {display(formData.resumeName)}
        </p>
        {has(formData.certificateName) && (
          <p>
            <b>Certificate:</b> {display(formData.certificateName)}
          </p>
        )}
        {has(formData.referenceName) && (
          <p>
            <b>Reference:</b>{" "}
            {`${formData.referenceName} (${display(formData.referenceMobile)})`}
          </p>
        )}
        <p>
          <b>Job Role:</b>{" "}
          {formData.jobRole === "Other"
            ? display(formData.otherJobRole)
            : display(formData.jobRole)}
        </p>
        <p>
          <b>Skills:</b>{" "}
          {formData.skills?.length
            ? formData.skills
                .map((skill) => (skill === "Other" ? formData.otherSkills : skill))
                .filter(Boolean)
                .join(", ")
            : "-"}
        </p>
      </div>

      {(has(formData.cms) || has(formData.framework) || has(formData.nightShift)) && (
      <div className="bg-gray-50 p-3 sm:p-4 rounded-sm space-y-1 break-words">
        <h3 className="font-semibold text-base sm:text-lg mb-2">Technical Skills</h3>
        {has(formData.cms) && (
          <p>
            <b>CMS:</b> {formData.cms.join(", ")}
          </p>
        )}
        {has(formData.framework) && (
          <p>
            <b>Framework:</b> {formData.framework.join(", ")}
          </p>
        )}
        {has(formData.nightShift) && (
          <p>
            <b>Night Shift:</b> {display(formData.nightShift)}
          </p>
        )}
      </div>
      )}

      <div className="bg-gray-50 p-3 sm:p-4 rounded-sm space-y-1 md:col-span-2 break-words">
        <h3 className="font-semibold text-base sm:text-lg mb-2">System Info</h3>
        <p>
          <b>QR ID:</b> {display(qrId)}
        </p>
      </div>

      <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t md:border-t-0 py-3 flex flex-col md:flex-row gap-2 md:col-span-2 mt-2 sm:mt-4">
        <Button text="Back" onClick={onBack} className="md:flex-1" />
        <Button
          text={loading ? "Submitting..." : "Submit & Verify"}
          onClick={onSubmit}
          className="md:flex-1"
          disabled={loading}
        />
      </div>
    </div>
  );
};

export default Step3;
