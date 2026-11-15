export type UserRole =
  | "super_admin"
  | "admin"
  | "department_head"
  | "faculty"
  | "quality_monitor"
  | "research_monitor"
  | "graduate_coordinator"
  | "student"
  | "mahalla";

export type StudentRecord = {
  id: string;
  sourceRow: number;
  fullName: string;
  group: string;
  practiceAddress: string;
  supervisorRaw: string;
  supervisorName: string;
  phone: string | null;
  region: string;
  district: string | null;
  mahallaName: string | null;
  hasPhone: boolean;
  status: "active" | "inactive";
};

export type DashboardSummary = {
  totalStudents: number;
  groups: { name: string; count: number }[];
  supervisors: { name: string; count: number }[];
  regions: { name: string; count: number }[];
  mahallaRecords: number;
  missingPhones: number;
};

export type ProjectStageKey =
  | "problem"
  | "analysis"
  | "idea"
  | "development"
  | "implementation"
  | "monitoring"
  | "result"
  | "final_report";

export type ProjectStatus = "planned" | "active" | "review" | "completed" | "rejected";

export type DemoProject = {
  id: string;
  title: string;
  mahalla: string;
  owner: string;
  supervisor: string;
  status: ProjectStatus;
  progress: number;
  currentStage: ProjectStageKey;
  dueDate: string;
  direction: string;
};
