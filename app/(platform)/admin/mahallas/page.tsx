import { MahallaMap, type MahallaLocation } from "@/components/mahallas/mahalla-map";
import locationData from "@/data/tashkent-mahalla-locations.json";
export const metadata={title:"Mahallalar"};
export default function MahallasPage(){return <MahallaMap locations={locationData.locations as MahallaLocation[]}/>}
