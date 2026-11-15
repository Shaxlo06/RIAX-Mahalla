import { EntityManager } from "@/components/smart-riax/entity-manager";
import { certificateFields } from "@/components/smart-riax/configs";
export const metadata={title:"Sertifikatlar"};
export default function Page(){return <EntityManager table="faculty_certificates" moduleKey="faculty" eyebrow="Kasbiy va ilmiy yutuqlar" title="Professor-o‘qituvchilar sertifikatlari" description="Sertifikatlarni kategoriya, amal qilish muddati va tasdiqlash holati bo‘yicha boshqaring." fields={certificateFields} columns={["certificate_name","faculty_id","category","issuing_organization","issue_date","expiration_date","verification_status"]} statusKey="verification_status" storageFolder="certificates"/>}
