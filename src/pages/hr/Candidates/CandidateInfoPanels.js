import {
  FiBookOpen,
  FiBriefcase,
  FiDollarSign,
  FiGrid,
  FiLayers,
  FiMail,
  FiMapPin,
  FiMoon,
  FiPhone,
  FiStar,
  FiUsers,
  FiUser,
} from "react-icons/fi";
import CommonTable from "../../../components/common/CommonTable";
import DetailItem from "../../../components/common/DetailItem";
import SectionHeader from "../../../components/common/SectionHeader";
import { roundLabels } from "../../../utils/candidateInterview";

const formatValue = (value) => {
  if (!value) return "N/A";
  return Array.isArray(value) ? value.join(", ") : value;
};

const salaryText = (amount, period) =>
  amount ? `${amount} / ${period === "monthly" ? "month" : "annum"}` : "N/A";

const reportColumns = [
  { header: "Round", accessor: "round", render: (value) => roundLabels[value] || value || "N/A" },
  {
    header: "Type",
    accessor: "roundType",
    render: (value) => value?.replaceAll("_", " ") || "Technical",
  },
  { header: "Interviewer", accessor: "interviewer", render: (value) => value || "N/A" },
  { header: "Score", accessor: "score", render: (value) => `${value ?? 0} / 10` },
  { header: "Status", accessor: "status", render: (value) => value || "N/A" },
  { header: "Comments", accessor: "comments", render: (value) => value || "—" },
];

const CandidateInfoPanels = ({ candidate, activeTab, onPreview }) => (
  <div className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900 md:p-5">
    {activeTab === "details" && (
      <div id="details-panel" role="tabpanel" aria-labelledby="details-tab">
        <SectionHeader
          title="Candidate Details"
          subtitle="Candidate contact, experience and role information."
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <DetailItem
            icon={<FiMail className="text-[#f84525]" />}
            label="Email"
            value={formatValue(candidate.email)}
          />
          <DetailItem
            icon={<FiPhone className="text-[#f84525]" />}
            label="Mobile"
            value={formatValue(candidate.mobile)}
          />
          <DetailItem
            icon={<FiPhone className="text-[#f84525]" />}
            label="Alt Mobile"
            value={formatValue(candidate.altMobile)}
          />
          <DetailItem
            icon={<FiBookOpen className="text-[#f84525]" />}
            label="Qualification"
            value={formatValue(candidate.qualification)}
          />
          <DetailItem
            icon={<FiMapPin className="text-[#f84525]" />}
            label="Branch"
            value={formatValue(candidate.branch)}
          />
          <DetailItem
            icon={<FiStar className="text-[#f84525]" />}
            label="Experience"
            value={
              candidate.experienceType === "fresher"
                ? "Fresher"
                : `${formatValue(candidate.experience)} yrs`
            }
          />
          <DetailItem
            icon={<FiBriefcase className="text-[#f84525]" />}
            label="Company"
            value={formatValue(candidate.currentCompany)}
          />
          <DetailItem
            icon={<FiDollarSign className="text-[#f84525]" />}
            label="Current Salary"
            value={salaryText(candidate.currentSalary, candidate.currentSalaryPeriod)}
          />
          <DetailItem
            icon={<FiDollarSign className="text-[#f84525]" />}
            label="Expected Salary"
            value={salaryText(candidate.expectedSalary, candidate.expectedSalaryPeriod)}
          />
          <DetailItem
            icon={<FiMoon className="text-[#f84525]" />}
            label="Night Shift"
            value={formatValue(candidate.nightShift)}
          />
          <DetailItem
            icon={<FiUser className="text-[#f84525]" />}
            label="Reference"
            value={
              candidate.referenceName
                ? `${candidate.referenceName} (${candidate.referenceMobile || "N/A"})`
                : "N/A"
            }
          />
          <DetailItem
            icon={<FiUsers className="text-[#f84525]" />}
            label="Skills"
            value={formatValue(candidate.skills)}
          />
          <DetailItem
            icon={<FiLayers className="text-[#f84525]" />}
            label="Framework"
            value={formatValue(candidate.framework)}
          />
          <DetailItem
            icon={<FiGrid className="text-[#f84525]" />}
            label="CMS"
            value={formatValue(candidate.cms)}
          />
        </div>
      </div>
    )}

    {activeTab === "documents" && (
      <div id="documents-panel" role="tabpanel" aria-labelledby="documents-tab">
        <SectionHeader title="Documents" subtitle="Candidate resume and certificates." />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {[
            ["Resume", candidate.resume, candidate.resumeName],
            ["Certificate", candidate.certificate, candidate.certificateName],
          ].map(([label, url, fileName]) => (
            <div key={label} className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{label}</p>
              <p className="mt-1 break-all text-xs text-gray-500">
                {fileName || (url ? "Uploaded" : "Not uploaded")}
              </p>
              {url && (
                <button
                  type="button"
                  onClick={() => onPreview({ title: `${candidate.name} - ${label}`, url })}
                  className="mt-3 text-sm text-[#f84525] underline"
                >
                  View {label}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    )}

    {activeTab === "reports" && (
      <div id="reports-panel" role="tabpanel" aria-labelledby="reports-tab">
        <SectionHeader
          title="Interview Reports"
          subtitle="Scores and interviewer feedback for completed rounds."
        />
        <CommonTable
          columns={reportColumns}
          data={candidate.interviewRounds || []}
          emptyText="No interview report added yet."
        />
      </div>
    )}
  </div>
);

export default CandidateInfoPanels;
