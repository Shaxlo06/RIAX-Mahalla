import { ResearchWorkProfile } from "@/components/smart-riax/research-monitoring";
export const metadata={title:"BMI monitoringi"};
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <ResearchWorkProfile mode="thesis" id={id}/>}
