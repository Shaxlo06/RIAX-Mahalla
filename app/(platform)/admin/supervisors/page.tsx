import { DirectoryManager, type DirectoryPerson } from "@/components/modules/directory-manager";
import { getDashboardSummary, students } from "@/lib/data";
export const metadata={title:"Rahbarlar"};
export default function SupervisorsPage(){
  const rows=getDashboardSummary().supervisors.map((item,index)=>({id:`supervisor-${index}`,name:item.name,meta:"Raqamli iqtisodiyot va axborot xavfsizligi kafedrasi",count:item.count}));
  const details=Object.fromEntries(rows.map((row)=>[row.id,students.filter((student)=>student.supervisorName===row.name).map((student):DirectoryPerson=>({id:student.id,fullName:student.fullName,group:student.group,supervisorName:student.supervisorName,phone:student.phone}))]));
  return <DirectoryManager title="Amaliyot rahbarlari" eyebrow="Nazorat va mentorlik" description="Rahbar kartasini bosing — unga biriktirilgan talabalar ro‘yxati ochiladi." iconName="supervisor" rows={rows} details={details} storageKey="riax-supervisors" unit="Talabalar"/>
}
