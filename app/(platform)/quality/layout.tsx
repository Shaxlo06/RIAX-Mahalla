import { ModuleNav } from "@/components/smart-riax/module-nav";
export default function Layout({children}:{children:React.ReactNode}){return <><ModuleNav items={[{label:"Kontent sifati",href:"/quality"},{label:"Dars sifati",href:"/quality/lessons"},{label:"AI deklaratsiyalari",href:"/quality/ai"},{label:"Tuzatish ishlari",href:"/quality/actions"}]}/>{children}</>}
