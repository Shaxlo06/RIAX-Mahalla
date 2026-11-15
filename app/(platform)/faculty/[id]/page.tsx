import { FacultyProfile } from "@/components/smart-riax/faculty-profile";

export const metadata={title:"O‘qituvchi profili"};
export default async function Page({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  return <FacultyProfile id={id}/>;
}
