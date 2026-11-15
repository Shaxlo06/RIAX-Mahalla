import type { UserRole } from "@/types/domain";

export type DemoUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  title: string;
};

export const demoUsers: DemoUser[] = [
  { id: "demo-admin", name: "Kafedra mudiri", email: "admin@riax.uz", password: "Demo123!", role: "admin", title: "Admin / kafedra mudiri" },
  { id: "demo-super-admin", name: "SMART RIAX Super Admin", email: "superadmin@riax.uz", password: "Demo123!", role: "super_admin", title: "Super Admin" },
  { id: "demo-faculty", name: "Professor-o‘qituvchi", email: "professor@riax.uz", password: "Demo123!", role: "faculty", title: "Professor-o‘qituvchi" },
  { id: "demo-quality", name: "Ta’lim sifati mas’uli", email: "sifat@riax.uz", password: "Demo123!", role: "quality_monitor", title: "Ta’lim sifati monitoring mas’uli" },
  { id: "demo-research", name: "Ilmiy nashrlar mas’uli", email: "nashr@riax.uz", password: "Demo123!", role: "research_monitor", title: "Ilmiy nashrlar monitoring mas’uli" },
  { id: "demo-graduate", name: "Bitiruv ishlari koordinatori", email: "bitiruvchi@riax.uz", password: "Demo123!", role: "graduate_coordinator", title: "Bitiruv ishlari koordinatori" },
  { id: "demo-student", name: "Munisaxon Qosimova", email: "talaba@riax.uz", password: "Demo123!", role: "student", title: "Talaba" },
  { id: "demo-mahalla", name: "Mahalla koordinatori", email: "mahalla@riax.uz", password: "Demo123!", role: "mahalla", title: "Mahalla koordinatori" },
];

export const roleHome: Record<UserRole, string> = {
  super_admin: "/admin",
  admin: "/admin",
  department_head: "/admin",
  faculty: "/admin",
  quality_monitor: "/admin",
  research_monitor: "/admin",
  graduate_coordinator: "/admin",
  student: "/student",
  mahalla: "/admin",
};

export const staffRoles: UserRole[] = ["super_admin", "admin", "department_head", "faculty", "quality_monitor", "research_monitor", "graduate_coordinator", "mahalla"];

export function roleArea(role: UserRole) {
  return role === "student" ? "student" : "admin";
}

export function isUserRole(value: unknown): value is UserRole {
  return ["super_admin", "admin", "department_head", "faculty", "quality_monitor", "research_monitor", "graduate_coordinator", "student", "mahalla"].includes(String(value));
}
