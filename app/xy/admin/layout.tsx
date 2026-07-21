import AdminShell from "../../admin/AdminShell";

export default function XYAdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
