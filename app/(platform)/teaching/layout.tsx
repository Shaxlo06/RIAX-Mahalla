import { ModuleNav } from "@/components/smart-riax/module-nav";
export default function Layout({children}:{children:React.ReactNode}){return <><ModuleNav items={[{label:"Fanlar",href:"/teaching"},{label:"O‘quv materiallari",href:"/teaching/materials"},{label:"Dars va foydalanish",href:"/teaching/lessons"},{label:"Portfolioni yuklab olish",href:"/teaching/portfolio"}]}/>{children}</>}
