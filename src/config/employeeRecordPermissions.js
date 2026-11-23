export const employeeRecordPermissions = [
  ["employeeRecordGroup", "Reviews & Salary History", ["view", "currentView", "current", "nextReviewView", "nextReview", "leavingView", "leaving", "nafView", "naf", "documentsProvidedView", "documentsProvided", "salaryReleaseView", "salaryRelease"], {
    view: "View History",
    currentView: "View Current Record",
    current: "Add / Update Current Record",
    nextReviewView: "View Next Review",
    nextReview: "Add / Update Next Review",
    leavingView: "View Leaving Process",
    leaving: "Add / Update Leaving Record",
    nafView: "View NAF Process",
    naf: "Add / Update NAF Process",
    documentsProvidedView: "View Documents Provided",
    documentsProvided: "Add / Update Documents Provided",
    salaryReleaseView: "View Salary Release",
    salaryRelease: "Add / Update Salary Release",
  }],
];
export const employeeRecordPermissionKeys = employeeRecordPermissions.map(([key]) => key);
