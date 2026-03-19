import Button from "../../components/common/Button";

const Step3 = ({ formData, qrId, onBack, onSubmit, loading }) => {
  const display = (value) => value || "-";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm md:text-base">
      <div className="bg-gray-50 p-4 rounded-lg space-y-1">
        <h3 className="font-semibold text-lg mb-2">Personal Details</h3>
        <p>
          <b>Name:</b> {display(formData.name)}
        </p>
        <p>
          <b>Qualification:</b> {display(formData.qualification)}
        </p>
        <p>
          <b>Mobile:</b> {display(formData.mobile)}
        </p>
        <p>
          <b>Alt Mobile:</b> {display(formData.altMobile)}
        </p>
        <p>
          <b>Email:</b> {display(formData.email)}
        </p>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg space-y-1">
        <h3 className="font-semibold text-lg mb-2">Job Details</h3>
        <p>
          <b>Experience:</b> {display(formData.experience)}
        </p>
        <p>
          <b>Current Salary:</b> {display(formData.currentSalary)}
        </p>
        <p>
          <b>Current Company:</b> {display(formData.currentCompany)}
        </p>
        <p>
          <b>Expected Salary:</b> {display(formData.expectedSalary)}
        </p>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg space-y-1">
        <h3 className="font-semibold text-lg mb-2">Additional Info</h3>
        <p>
          <b>Certificate:</b> {display(formData.certificate)}
        </p>
        <p>
          <b>Reference:</b>{" "}
          {formData.referenceName
            ? `${formData.referenceName} (${display(formData.referenceMobile)})`
            : "-"}
        </p>
        <p>
          <b>Job Role:</b>{" "}
          {formData.jobRole === "Other"
            ? display(formData.otherJobRole)
            : display(formData.jobRole)}
        </p>
        <p>
          <b>Skills:</b> {display(formData.skills)}
        </p>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg space-y-1">
        <h3 className="font-semibold text-lg mb-2">Technical Skills</h3>
        <p>
          <b>CMS:</b> {formData.cms.length ? formData.cms.join(", ") : "-"}
        </p>
        <p>
          <b>Framework:</b>{" "}
          {formData.framework.length ? formData.framework.join(", ") : "-"}
        </p>
        <p>
          <b>Night Shift:</b> {display(formData.nightShift)}
        </p>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg space-y-1 md:col-span-2">
        <h3 className="font-semibold text-lg mb-2">System Info</h3>
        <p>
          <b>QR ID:</b> {display(qrId)}
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-2 md:col-span-2 mt-4">
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
