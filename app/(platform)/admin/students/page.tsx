import { StudentManager } from "@/components/students/student-manager";
import { students } from "@/lib/data";

export const metadata={title:"Talabalar"};
export default function StudentsPage(){return <StudentManager initialData={students}/>}
