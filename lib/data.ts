import "server-only";
import rawData from "@/data/riax-data.json";
import type { DashboardSummary, StudentRecord } from "@/types/domain";

export const students = rawData.students as StudentRecord[];

function countBy(items: string[]) {
  return [...items.reduce((map, item) => map.set(item, (map.get(item) || 0) + 1), new Map<string, number>())]
    .map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function getDashboardSummary(): DashboardSummary {
  return {
    totalStudents: students.length,
    groups: countBy(students.map((student) => student.group)),
    supervisors: countBy(students.map((student) => student.supervisorName)),
    regions: countBy(students.map((student) => student.region).filter((region) => region !== "Kiritilmagan")),
    mahallaRecords: students.filter((student) => student.mahallaName).length,
    missingPhones: students.filter((student) => !student.hasPhone).length,
  };
}

export function findStudent(id: string) {
  return students.find((student) => student.id === id) ?? students[0];
}
