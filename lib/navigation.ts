import {
  BadgeCheck,
  BookOpenCheck,
  GraduationCap,
  Presentation,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/types/domain";

export type NavSubItem = { label: string; href: string };

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  children?: NavSubItem[];
};

export const primaryNavigation: NavItem[] = [
  {
    label: "Professor-o‘qituvchilar",
    href: "/faculty",
    icon: UsersRound,
    children: [
      { label: "Malaka oshirish", href: "/faculty/development" },
      { label: "Sertifikatlar", href: "/faculty/certificates" },
    ],
  },
  { label: "Ilmiy nashrlar", href: "/publications", icon: BookOpenCheck },
  { label: "Dars jarayoni", href: "/teaching", icon: Presentation },
  { label: "Ta’lim sifati", href: "/quality", icon: BadgeCheck },
  {
    label: "Bitiruvchilar",
    href: "/graduates/internships",
    icon: GraduationCap,
    children: [
      { label: "Amaliyot", href: "/graduates/internships" },
      { label: "BMI", href: "/graduates/theses" },
      { label: "YADK", href: "/graduates/attestation" },
    ],
  },
];

const roles: UserRole[] = [
  "super_admin", "admin", "department_head", "faculty", "quality_monitor",
  "research_monitor", "graduate_coordinator", "student", "mahalla",
];

export const navByRole = Object.fromEntries(
  roles.map((role) => [role, primaryNavigation]),
) as Record<UserRole, NavItem[]>;
