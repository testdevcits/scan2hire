export const employeeDocumentFields = [
                ["aadhaarCard", "Aadhaar Card"], ["panCard", "PAN Card"], ["passbook", "Bank Proof / Passbook"],
                ["bloodGroupProof", "Blood Group Proof"], ["bondDocument", "Bond Document Original"],
                ["bondLetter", "Bond Letter"], ["addressProof", "Address Proof"],
                ["degree", "Degree / Qualification"], ["resume", "Resume"], ["offerLetter", "Offer Letter"],
                ["appointmentLetter", "Appointment Letter"], ["leavingLetter", "Leaving Letter"], ["experienceCertificate", "Experience Certificate"],
                ["previousCompanyDocument", "Previous Company Document"], ["documentXerox", "Previous Document Xerox"], ["bankStatement", "Bank Statement"]
              ];

// Previous-company files are collected per company in EmploymentHistory.
export const employeeCreateDocumentFields = employeeDocumentFields.filter(([key]) => !["offerLetter", "leavingLetter", "experienceCertificate", "previousCompanyDocument", "documentXerox", "bankStatement"].includes(key));
