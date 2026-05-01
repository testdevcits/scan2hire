import SidebarLayout from "./SidebarLayout";

const AdminLayout = () => {
  const navItems = [
    { label: "Dashboard", path: "/admin/dashboard", end: true },
    { label: "Manage HR", path: "/admin/hrs" },
    { label: "Employees", path: "/admin/employees" },
    { label: "Candidates", path: "/admin/candidates" },
    { label: "Reports", path: "/admin/reports" },
    { label: "Settings", path: "/admin/settings" },
  ];

  return <SidebarLayout title="Super Admin" navItems={navItems} variant="admin" />;
};

export default AdminLayout;
