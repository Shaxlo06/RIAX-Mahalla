import { DirectoryManager, type DirectoryPerson } from "@/components/modules/directory-manager";
import { PLATFORM_NAME } from "@/lib/branding";
import { getDashboardSummary, students } from "@/lib/data";
export const metadata={title:"Akademik guruhlar"};
export default function GroupsPage(){
  const rows=getDashboardSummary().groups.map((item,index)=>({id:`group-${index}`,name:item.name,meta:`2023/2024 o‘quv yili · ${PLATFORM_NAME} platformasi`,count:item.count}));
  const details=Object.fromEntries(rows.map((row)=>[row.id,students.filter((student)=>student.group===row.name).map((student):DirectoryPerson=>({id:student.id,fullName:student.fullName,group:student.group,supervisorName:student.supervisorName,phone:student.phone}))]));
  return <DirectoryManager title="Akademik guruhlar" eyebrow="Ta’lim tuzilmasi" description="Guruh kartasini bosing — talabalar va ularga biriktirilgan rahbarlar ro‘yxati ochiladi." iconName="group" rows={rows} details={details} storageKey="riax-groups" unit="Talabalar"/>
}
