import { EntityManager } from "@/components/smart-riax/entity-manager";
import { certificateFields } from "@/components/smart-riax/configs";
export const metadata={title:"Malaka sertifikatlari"};
export default function Page(){return <EntityManager table="faculty_certificates" moduleKey="faculty" eyebrow="Hujjatlar nazorati" title="Malaka sertifikatlari" description="Sertifikat muddati, fayli va tasdiqlash holatini boshqaring." fields={certificateFields} columns={["certificate_name","issuing_organization","certificate_number","expiration_date","verification_status"]} statusKey="verification_status" storageFolder="certificates"/>}
