"use client";

import { useState } from "react";
import { Check, ChevronRight, RotateCcw } from "lucide-react";
import { stageDefinitions } from "@/lib/project-data";
import type { ProjectStageKey } from "@/types/domain";

export function StageJourney({ currentStage, editable = false }: { currentStage: ProjectStageKey; editable?: boolean }) {
  const initial = Math.max(0, stageDefinitions.findIndex((stage) => stage.key === currentStage));
  const [current, setCurrent] = useState(initial);
  const [saved, setSaved] = useState(false);

  function advance() {
    setCurrent((value) => Math.min(stageDefinitions.length - 1, value + 1));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  return <section className="panel rounded-[26px] p-5 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-[10px] font-black uppercase tracking-[.2em] text-[#0b6fe8]">Loyiha yo‘l xaritasi</p><h2 className="font-display mt-1 text-2xl font-black text-[#10244b]">8 bosqichli rivojlanish</h2></div>
      {editable && <button onClick={advance} disabled={current === 7} className="focus-ring inline-flex items-center gap-2 rounded-xl bg-[#08265f] px-4 py-2.5 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-45">{current === 7 ? <Check size={16}/> : <ChevronRight size={16}/>} {current === 7 ? "Yakunlangan" : "Keyingi bosqich"}</button>}
    </div>
    <div className="mt-5 grid gap-3 min-[430px]:grid-cols-2 sm:mt-6 xl:grid-cols-4">
      {stageDefinitions.map((stage, index) => {
        const complete = index < current; const active = index === current;
        return <button key={stage.key} type="button" disabled={!editable} onClick={() => editable && setCurrent(index)} className={`relative min-h-24 overflow-hidden rounded-2xl border p-4 text-left transition ${active ? "border-[#0b6fe8] bg-[#08265f] text-white shadow-xl shadow-blue-900/15" : complete ? "border-emerald-200 bg-emerald-50 text-[#153c32]" : "border-[#dce5f1] bg-[#f8fbff] text-[#66738c]"}`}>
          <span className={`grid size-8 place-items-center rounded-xl text-xs font-black ${active ? "bg-[#f2b705] text-[#061b4f]" : complete ? "bg-[#43d17a] text-white" : "bg-white text-[#71809a]"}`}>{complete ? <Check size={16}/> : index + 1}</span>
          <b className="mt-3 block text-xs leading-snug">{stage.title}</b>
          {active && <span className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-[#f2b705] to-[#43d17a]"/>}
        </button>;
      })}
    </div>
    {saved && <p className="mt-4 flex items-center gap-2 text-xs font-bold text-emerald-700"><RotateCcw size={14}/> Bosqich demo rejimida yangilandi.</p>}
  </section>;
}
