import { ModuleNav } from "@/components/smart-riax/module-nav";
export default function Layout({children}:{children:React.ReactNode}){return <><ModuleNav items={[{label:"Xodimlar reyestri",href:"/faculty"},{label:"Sertifikatlar",href:"/faculty/certificates"},{label:"Malaka oshirish",href:"/faculty/development"}]}/>{children}</>}
