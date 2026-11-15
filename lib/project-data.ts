import type { DemoProject, ProjectStageKey } from "@/types/domain";

export const stageDefinitions: { key: ProjectStageKey; title: string; short: string }[] = [
  { key: "problem", title: "Muammoni aniqlash", short: "Muammo" },
  { key: "analysis", title: "Tahlil", short: "Tahlil" },
  { key: "idea", title: "Loyiha g‘oyasi", short: "G‘oya" },
  { key: "development", title: "Ishlab chiqish", short: "Ishlab chiqish" },
  { key: "implementation", title: "Amalga oshirish", short: "Amaliyot" },
  { key: "monitoring", title: "Monitoring", short: "Monitoring" },
  { key: "result", title: "Natija", short: "Natija" },
  { key: "final_report", title: "Yakuniy hisobot", short: "Hisobot" },
];

export const demoProjects: DemoProject[] = [
  { id: "p1", title: "Mahalla murojaatlarini raqamlashtirish", mahalla: "Yorqin hayot MFY", owner: "Munisaxon Qosimova", supervisor: "Majidova I.", status: "active", progress: 63, currentStage: "implementation", dueDate: "2026-12-10", direction: "Raqamli xizmatlar" },
  { id: "p2", title: "Yoshlar bandligi analitik xaritasi", mahalla: "Choshtepa MFY", owner: "Ataxan Ataxanov", supervisor: "Ikramov M.", status: "review", progress: 78, currentStage: "monitoring", dueDate: "2026-11-28", direction: "Bandlik" },
  { id: "p3", title: "Kiberxavfsizlik savodxonligi", mahalla: "Nurmakon MFY", owner: "Abdulaziz Abdullayev", supervisor: "Abidov A.", status: "active", progress: 45, currentStage: "development", dueDate: "2026-12-18", direction: "Axborot xavfsizligi" },
  { id: "p4", title: "Ijtimoiy obyektlar monitoringi", mahalla: "Furqat MFY", owner: "Diyorbek Rustamov", supervisor: "Qulmatova S.", status: "planned", progress: 18, currentStage: "analysis", dueDate: "2027-01-15", direction: "Monitoring" },
  { id: "p5", title: "Elektron mahalla xizmatlari katalogi", mahalla: "Jayxun MFY", owner: "Aqilbek Turganbaev", supervisor: "Kuchkarov T.", status: "completed", progress: 100, currentStage: "final_report", dueDate: "2026-11-12", direction: "E-mahalla" },
];
