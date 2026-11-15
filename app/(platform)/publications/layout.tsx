import { ModuleNav } from "@/components/smart-riax/module-nav";
export default function Layout({children}:{children:React.ReactNode}){return <><ModuleNav items={[{label:"Nashrlar bazasi",href:"/publications"},{label:"Mualliflar",href:"/publications/faculty"},{label:"Analitika",href:"/publications/analytics"},{label:"Import va DOI",href:"/publications/import"}]}/>{children}</>}
