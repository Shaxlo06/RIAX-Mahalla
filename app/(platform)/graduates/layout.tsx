import { ModuleNav } from "@/components/smart-riax/module-nav";
export default function Layout({children}:{children:React.ReactNode}){return <><ModuleNav items={[{label:"Amaliyot",href:"/graduates/internships"},{label:"BMI",href:"/graduates/theses"},{label:"YADK",href:"/graduates/attestation"}]}/>{children}</>}
