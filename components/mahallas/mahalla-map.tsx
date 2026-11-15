"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Crosshair, ExternalLink, MapPinned, Search, Users } from "lucide-react";
import type { MultiPolygon, Polygon } from "geojson";
import { PageHeader } from "@/components/ui/page-header";

export type MahallaLocation = {
  id: string;
  name: string;
  district: string;
  address: string;
  latitude: number;
  longitude: number;
  sourceName: string;
  source: string;
  geometry: Polygon | MultiPolygon;
  students: { id: string; fullName: string; group: string; supervisorName: string }[];
};

export function MahallaMap({ locations }: { locations: MahallaLocation[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markersRef = useRef<import("leaflet").LayerGroup | null>(null);
  const [query, setQuery] = useState("");
  const [district, setDistrict] = useState("all");
  const [selectedId, setSelectedId] = useState(locations[0]?.id ?? "");
  const districts = useMemo(() => [...new Set(locations.map((location) => location.district))].sort((a,b)=>a.localeCompare(b,"uz")), [locations]);
  const filtered = useMemo(() => locations.filter((location) => {
    const matchesQuery = `${location.name} ${location.district} ${location.address}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (district === "all" || location.district === district);
  }), [locations, query, district]);
  const selected = locations.find((location) => location.id === selectedId) ?? locations[0];

  useEffect(() => {
    let disposed = false;
    async function renderMap() {
      if (!containerRef.current) return;
      const L = await import("leaflet");
      if (disposed || !containerRef.current) return;
      if (!mapRef.current) {
        mapRef.current = L.map(containerRef.current, { zoomControl: false, minZoom: 10, maxZoom: 18 }).setView([41.3111, 69.2797], 11);
        L.control.zoom({ position: "bottomright" }).addTo(mapRef.current);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(mapRef.current);
      }
      markersRef.current?.remove();
      const layer = L.layerGroup().addTo(mapRef.current);
      markersRef.current = layer;
      for (const location of filtered) {
        if (location.geometry) {
          const boundary = L.geoJSON(location.geometry, { style: {
            color: location.id === selectedId ? "#b17c00" : "#0b5ecb",
            weight: location.id === selectedId ? 3 : 1.5,
            fillColor: location.id === selectedId ? "#f2b705" : "#63a8f5",
            fillOpacity: location.id === selectedId ? .42 : .18,
          }}).addTo(layer);
          boundary.on("click", () => setSelectedId(location.id));
        }
        const marker = L.circleMarker([location.latitude, location.longitude], {
          radius: location.id === selectedId ? 11 : 8,
          color: "#ffffff",
          weight: 3,
          fillColor: location.id === selectedId ? "#f2b705" : "#0b6fe8",
          fillOpacity: 1,
        }).addTo(layer);
        marker.bindTooltip(location.name, { direction: "top", offset: [0,-8], className: "font-bold" });
        marker.bindPopup(`<div><b style="color:#08265f;font-size:14px">${location.name}</b><p style="margin:5px 0;color:#60708a">${location.district}</p><strong>${location.students.length} talaba</strong></div>`, { className: "riax-map-popup" });
        marker.on("click", () => setSelectedId(location.id));
      }
      if (filtered.length > 1) {
        const bounds = L.latLngBounds(filtered.map((location) => [location.latitude, location.longitude] as [number,number]));
        mapRef.current.fitBounds(bounds, { padding: [35,35], maxZoom: 12 });
      } else if (filtered[0]) mapRef.current.flyTo([filtered[0].latitude, filtered[0].longitude], 14);
      window.setTimeout(() => mapRef.current?.invalidateSize(), 50);
    }
    renderMap();
    return () => { disposed = true; };
  }, [filtered, selectedId]);

  useEffect(() => () => { mapRef.current?.remove(); mapRef.current = null; }, []);

  function focusLocation(location: MahallaLocation) {
    setSelectedId(location.id);
    mapRef.current?.flyTo([location.latitude, location.longitude], 15, { duration: .8 });
  }

  return <div className="animate-enter space-y-5">
    <PageHeader eyebrow="Geo monitoring" title="Toshkent mahallalari xaritasi" description="Excel’dagi amaliyot manzillari SOATO va OpenStreetMap koordinatalari bilan xaritada ko‘rsatilgan." icon={MapPinned}/>
    <section className="panel overflow-hidden rounded-[26px]">
      <div className="grid gap-3 border-b border-[#dce6f2] p-4 lg:grid-cols-[1fr_260px_auto]">
        <label className="flex items-center gap-2 rounded-xl border border-[#d8e3f1] bg-[#f8fbff] px-3"><Search size={17}/><input value={query} onChange={(event)=>setQuery(event.target.value)} className="h-11 flex-1 bg-transparent text-sm outline-none" placeholder="Mahalla yoki manzilni qidiring..."/></label>
        <select value={district} onChange={(event)=>setDistrict(event.target.value)} className="rounded-xl border border-[#d8e3f1] bg-white px-3 text-sm font-bold"><option value="all">Barcha tumanlar</option>{districts.map((item)=><option key={item}>{item}</option>)}</select>
        <div className="flex items-center justify-center gap-2 rounded-xl bg-[#08265f] px-4 text-xs font-black text-white"><MapPinned size={16}/>{filtered.length} lokatsiya</div>
      </div>
      <div className="grid min-h-[460px] lg:min-h-[680px] lg:grid-cols-[330px_1fr]">
        <aside className="scrollbar-thin max-h-56 overflow-y-auto border-b border-[#dce6f2] bg-[#f7faff] sm:max-h-72 lg:max-h-[680px] lg:border-b-0 lg:border-r">
          {filtered.map((location)=><button key={location.id} onClick={()=>focusLocation(location)} className={`flex w-full items-start gap-3 border-b border-[#dfe8f3] p-4 text-left transition ${selectedId===location.id?"bg-[#08265f] text-white":"hover:bg-white"}`}>
            <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${selectedId===location.id?"bg-[#f2b705] text-[#061b4f]":"bg-[#e1edff] text-[#0b6fe8]"}`}><Crosshair size={17}/></span>
            <span className="min-w-0"><b className="block truncate text-sm">{location.name}</b><small className={`mt-1 block text-[10px] font-semibold ${selectedId===location.id?"text-blue-100":"text-[#71809a]"}`}>{location.district} · {location.students.length} talaba</small></span>
          </button>)}
          {!filtered.length&&<p className="p-8 text-center text-xs font-bold text-[#71809a]">Mos lokatsiya topilmadi.</p>}
        </aside>
        <div className="relative min-h-[520px]"><div ref={containerRef} className="absolute inset-0"/>{selected&&<div className="absolute bottom-4 left-4 right-4 z-[500] rounded-2xl border border-white/70 bg-white/95 p-4 shadow-2xl backdrop-blur md:left-5 md:right-auto md:w-[430px]"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.16em] text-[#0b6fe8]">Tanlangan lokatsiya</p><h2 className="font-display mt-1 text-xl font-black text-[#10244b]">{selected.name}</h2><p className="mt-1 text-xs font-semibold text-[#68758d]">{selected.address}</p></div><a href={`https://www.openstreetmap.org/?mlat=${selected.latitude}&mlon=${selected.longitude}#map=16/${selected.latitude}/${selected.longitude}`} target="_blank" rel="noreferrer" className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#edf4ff] text-[#0b6fe8]" aria-label="OpenStreetMap’da ochish"><ExternalLink size={17}/></a></div><div className="mt-3 flex items-center gap-2 border-t border-[#e3eaf3] pt-3 text-xs font-bold"><Users size={16} className="text-[#0b6fe8]"/>{selected.students.length} talaba<span className="ml-auto font-mono text-[10px] text-[#71809a]">{selected.latitude.toFixed(5)}, {selected.longitude.toFixed(5)}</span></div></div>}</div>
      </div>
    </section>
    <p className="text-[10px] font-semibold text-[#71809a]">Lokatsiyalar: SOATO mahalla centroid dataset · Xarita: © OpenStreetMap contributors. Nuqtalar mahalla markazini bildiradi.</p>
  </div>;
}
