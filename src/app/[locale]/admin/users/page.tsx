import { HomeHeader } from "@/components/layout/HomeHeader";
import { AdminUsersWorkspace } from "@/components/features/admin/AdminUsersWorkspace";

export const metadata = { title: "Admin | Eureka!", robots: { index: false, follow: false } };

export default function UsersPage() {
  return <div className="min-h-screen bg-[#0b0f17]"><HomeHeader activePage="academy" /><AdminUsersWorkspace /></div>;
}
