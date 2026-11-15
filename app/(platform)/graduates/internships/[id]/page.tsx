import { GraduateRecordProfile } from "@/components/smart-riax/graduate-record-profile";
export const metadata={title:"Amaliyot talaba profili"};
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <GraduateRecordProfile table="internship_assignments" id={id} back="/graduates/internships" title="Amaliyot profili"/>}
