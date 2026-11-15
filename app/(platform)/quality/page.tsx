import { EntityManager } from "@/components/smart-riax/entity-manager";
import { qualityFields } from "@/components/smart-riax/configs";
export const metadata={title:"Ta’lim sifati"};
export default function Page(){return <EntityManager table="quality_reviews" moduleKey="quality" eyebrow="Sifat nazorati" title="O‘quv kontenti sifati" description="Sillabusga moslik, to‘liqlik, dolzarblik va tuzilmani dalillar asosida baholang." fields={qualityFields} columns={["material_id","syllabus_compliance","completeness","overall_score","status"]} statusKey="status"/>}

