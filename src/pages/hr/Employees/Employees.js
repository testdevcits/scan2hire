// pages/Hr/Employees.js
import { useEffect, useState } from "react";
import { useEmployee } from "../../contexts/Hr/EmployeeContext";
import CommonTable from "../CommonTable";
import CommonLoader from "../../components/common/CommonLoader";
import FilePreviewModal from "../../components/common/FilePreviewModal";

function Employees() {
  const { employees, loading, error, fetchEmployees } = useEmployee();

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    fetchEmployees();
    // eslint-disable-next-line
  }, []);

  // -------------------------
  // Table Columns
  // -------------------------
  const columns = [
    { header: "Employee ID", accessor: "employeeId" },
    { header: "Name", accessor: "name" },
    { header: "Email", accessor: "email" },
    { header: "Mobile", accessor: "mobile" },
    { header: "Department", accessor: "department" },
    { header: "Designation", accessor: "designation" },
    {
      header: "Status",
      accessor: "isActive",
      render: (val) =>
        val ? (
          <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700">
            Active
          </span>
        ) : (
          <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-500">
            Inactive
          </span>
        ),
    },
  ];

  // -------------------------
  // Actions (View / etc)
  // -------------------------
  const actions = [
    {
      label: "View",
      className: "bg-green-500 text-white",
      onClick: (row) => setSelectedEmployee(row),
    },
  ];

  const formatValue = (val) => {
    if (!val) return "N/A";
    if (Array.isArray(val)) return val.join(", ");
    return val;
  };

  if (loading) return <CommonLoader text="Fetching employees..." />;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="relative p-3 md:p-6">
      <h1 className="text-xl font-bold mb-4">Employees List</h1>

      <CommonTable columns={columns} data={employees} actions={actions} />

      {/* Employee Details Drawer */}
      {selectedEmployee && (
        <div className="fixed inset-0 bg-black/40 z-40 flex justify-center items-start pt-20">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-4 relative">
            <button
              className="absolute top-2 right-2 text-gray-600 hover:text-gray-900"
              onClick={() => setSelectedEmployee(null)}
            >
              ✖
            </button>

            <h2 className="text-lg font-semibold mb-4">
              {formatValue(selectedEmployee.name)} -{" "}
              {formatValue(selectedEmployee.employeeId)}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <p>
                <strong>Email:</strong> {formatValue(selectedEmployee.email)}
              </p>
              <p>
                <strong>Mobile:</strong> {formatValue(selectedEmployee.mobile)}
              </p>
              <p>
                <strong>Department:</strong>{" "}
                {formatValue(selectedEmployee.department)}
              </p>
              <p>
                <strong>Designation:</strong>{" "}
                {formatValue(selectedEmployee.designation)}
              </p>
              <p>
                <strong>DOB:</strong>{" "}
                {selectedEmployee.dob
                  ? new Date(selectedEmployee.dob).toLocaleDateString()
                  : "N/A"}
              </p>
              <p>
                <strong>Joining Date:</strong>{" "}
                {selectedEmployee.dateOfJoining
                  ? new Date(
                      selectedEmployee.dateOfJoining
                    ).toLocaleDateString()
                  : "N/A"}
              </p>
              <p>
                <strong>Employee Type:</strong>{" "}
                {formatValue(selectedEmployee.employeeType)}
              </p>
              <p>
                <strong>Reporting Manager:</strong>{" "}
                {formatValue(selectedEmployee.reportingManager)}
              </p>
            </div>

            {/* Documents */}
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Documents</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {selectedEmployee.documents?.photo && (
                  <div>
                    <strong>Photo:</strong>
                    <button
                      type="button"
                      onClick={() =>
                        setPreview({
                          title: `${selectedEmployee.name || "Employee"} Photo`,
                          url: selectedEmployee.documents.photo.url,
                        })
                      }
                      className="block mt-1 w-24 h-24 rounded overflow-hidden border border-gray-200"
                    >
                      <img
                        src={selectedEmployee.documents.photo.url}
                        alt="Employee Photo"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  </div>
                )}
                {selectedEmployee.documents?.aadhaarCard && (
                  <p>
                    <strong>Aadhaar Card:</strong>{" "}
                    <button
                      type="button"
                      onClick={() =>
                        setPreview({
                          title: "Aadhaar Card",
                          url: selectedEmployee.documents.aadhaarCard.url,
                        })
                      }
                      className="text-blue-500 underline"
                    >
                      View
                    </button>
                  </p>
                )}
                {selectedEmployee.documents?.panCard && (
                  <p>
                    <strong>PAN Card:</strong>{" "}
                    <button
                      type="button"
                      onClick={() =>
                        setPreview({
                          title: "PAN Card",
                          url: selectedEmployee.documents.panCard.url,
                        })
                      }
                      className="text-blue-500 underline"
                    >
                      View
                    </button>
                  </p>
                )}
                {selectedEmployee.documents?.salarySlips?.length > 0 && (
                  <div>
                    <strong>Salary Slips:</strong>
                    <ul className="list-disc pl-5">
                      {selectedEmployee.documents.salarySlips.map(
                        (slip, idx) => (
                          <li key={idx}>
                            <button
                              type="button"
                              onClick={() =>
                                setPreview({
                                  title: `Salary Slip ${idx + 1}`,
                                  url: slip.url,
                                })
                              }
                              className="text-blue-500 underline"
                            >
                              Slip {idx + 1}
                            </button>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {preview && (
        <FilePreviewModal
          title={preview.title}
          url={preview.url}
          onClose={() => setPreview(null)}
        />
      )}
    </div>
  );
}

export default Employees;
