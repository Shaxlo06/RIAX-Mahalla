"use client";

import { createContext, useContext } from "react";
import type { SmartModuleKey } from "@/types/smart-domain";
import type { UserRole } from "@/types/domain";

type RoleContextValue = { role: UserRole; userId: string; canManage: (module: SmartModuleKey) => boolean };

const RoleContext = createContext<RoleContextValue | null>(null);

export function RoleProvider({ role, userId, children }: { role: UserRole; userId: string; children: React.ReactNode }) {
  const canManage = (module: SmartModuleKey) => {
    if (["super_admin", "admin", "department_head"].includes(role)) return true;
    if (role === "faculty") return ["faculty", "publications", "teaching"].includes(module);
    if (role === "quality_monitor") return ["teaching", "quality"].includes(module);
    if (role === "research_monitor") return module === "publications";
    if (role === "graduate_coordinator") return module === "graduates";
    return false;
  };
  return <RoleContext.Provider value={{ role, userId, canManage }}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const value = useContext(RoleContext);
  if (!value) throw new Error("RoleProvider topilmadi.");
  return value;
}
