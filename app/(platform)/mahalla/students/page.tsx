import { StudentsCompact } from "@/components/modules/platform-modules";
import { students } from "@/lib/data";
export const metadata={title:"Mahalla talabalari"};
export default function Page(){return <StudentsCompact students={students.slice(0,24)}/>}
