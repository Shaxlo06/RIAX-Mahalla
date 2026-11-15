"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";

export function Modal({open,onClose,title,description,children,size="md"}:{open:boolean;onClose:()=>void;title:string;description?:string;children:React.ReactNode;size?:"md"|"lg"}){
  const titleId=useId();
  const panelRef=useRef<HTMLElement>(null);
  const closeRef=useRef<HTMLButtonElement>(null);

  useEffect(()=>{
    if(!open)return;
    const previous=document.activeElement as HTMLElement|null;
    const frame=window.requestAnimationFrame(()=>closeRef.current?.focus());
    const key=(event:KeyboardEvent)=>{
      if(event.key==="Escape"){event.preventDefault();onClose();return}
      if(event.key!=="Tab"||!panelRef.current)return;
      const focusable=[...panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])')];
      if(!focusable.length)return;
      const first=focusable[0],last=focusable.at(-1)!;
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
    };
    document.addEventListener("keydown",key);
    const previousOverflow=document.body.style.overflow;
    document.body.style.overflow="hidden";
    return()=>{window.cancelAnimationFrame(frame);document.removeEventListener("keydown",key);document.body.style.overflow=previousOverflow;previous?.focus()};
  },[open,onClose]);

  if(!open)return null;
  return <div className="fixed inset-0 z-[100] flex items-end justify-center bg-[#020b25]/65 p-0 backdrop-blur-sm sm:grid sm:place-items-center sm:p-4"><button className="absolute inset-0" onClick={onClose} aria-label="Modal oynani yopish"/><section ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={titleId} className={`panel safe-bottom relative z-10 max-h-[calc(100dvh-8px)] w-full overflow-y-auto rounded-b-none rounded-t-[24px] p-4 sm:max-h-[90vh] sm:rounded-[28px] sm:p-6 ${size==="lg"?"sm:max-w-3xl":"sm:max-w-xl"}`}><button ref={closeRef} onClick={onClose} className="focus-ring absolute right-3 top-3 grid size-11 place-items-center rounded-xl border border-[#dce5f2] text-[#63718b] hover:bg-slate-50 sm:right-4 sm:top-4" aria-label="Yopish"><X size={18}/></button><h2 id={titleId} className="font-display break-words pr-12 text-xl font-black leading-tight sm:text-2xl">{title}</h2>{description&&<p className="mt-1 pr-10 text-xs leading-relaxed text-[#6c7890] sm:text-sm">{description}</p>}<div className="mt-4 sm:mt-5">{children}</div></section></div>;
}
