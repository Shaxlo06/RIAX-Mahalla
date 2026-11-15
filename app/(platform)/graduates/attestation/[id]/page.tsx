import { GraduateRecordProfile } from "@/components/smart-riax/graduate-record-profile";
export const metadata={title:"YADK talaba profili"};
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <GraduateRecordProfile table="attestation_candidates" id={id} back="/graduates/attestation" title="YADK profili"/>}
