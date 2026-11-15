import { DirectoryManager } from "@/components/modules/directory-manager";
import { PLATFORM_NAME } from "@/lib/branding";
export const metadata={title:"Foydalanuvchilar"};
const rows=[
  {id:"u-admin",name:`${PLATFORM_NAME} Administratori`,meta:"admin@riax.uz · Kafedra mudiri",count:1},
  {id:"u-student",name:"Demo Talaba",meta:"talaba@riax.uz · Talaba",count:1},
  {id:"u-mahalla",name:"Mahalla Koordinatori",meta:"mahalla@riax.uz · Mahalla koordinatori",count:1},
];
export default function Page(){return <DirectoryManager title="Foydalanuvchilar" eyebrow="Ruxsatlar boshqaruvi" description="Hisoblar, rollar va platformaga kirish huquqlarini boshqaring." iconName="users" rows={rows} storageKey="riax-users" unit="Faol rol"/>}
