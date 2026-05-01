import SidebarLayout from "./SidebarLayout";

const EmployeeLayout = () => {
  const navItems = [
    { label: "My Dashboard", path: "/employee/dashboard", end: true },
    { label: "Attendance", path: "/employee/attendance" },
    { label: "Leaves", path: "/employee/leaves" },
    { label: "Documents", path: "/employee/documents" },
    { label: "Candidates", path: "/employee/candidates" },
  ];

  return <SidebarLayout title="Employee Panel" navItems={navItems} />;
};

export default EmployeeLayout;
