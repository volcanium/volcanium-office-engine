import { useEffect, useState } from "react";
import Home from "./Home";
import Mirror from "./Mirror";

/* Ruban Volcanium : onglets = ceux du ruban d'origine encore visibles (Collaboration et Modules sont retirés en amont),
   « Accueil » est natif (React + API du moteur), les autres sont le miroir des contrôles d'origine. */

interface Tab { id: string; name: string }
const readTabs = (): Tab[] =>
  [...document.querySelectorAll<HTMLElement>("#toolbar .tabs li.ribtab")]
    .filter((li) => li.style.display !== "none" && li.getClientRects().length > 0)
    .map((li) => ({ id: li.querySelector("a")?.id ?? "", name: li.textContent?.trim() ?? "" }))
    .filter((t) => t.id);

export default function Ribbon() {
  const [tabs, setTabs] = useState<Tab[]>(() => readTabs());
  const [tab, setTab] = useState("home");
  useEffect(() => { const t = setInterval(() => setTabs((p) => { const n = readTabs(); return JSON.stringify(n) === JSON.stringify(p) ? p : n; }), 500); return () => clearInterval(t); }, []);
  const visible = tabs.filter((t) => t.id !== "file");
  const current = visible.some((t) => t.id === tab) ? tab : "home";
  return (
    <div className="flex h-full w-full flex-col bg-vc-container text-vc-text">
      <div role="tablist" className="flex h-9 shrink-0 items-stretch gap-0.5 border-b border-vc-line px-2">
        <button type="button" onPointerDown={(e) => e.preventDefault()} onClick={() => (document.querySelector("#toolbar .tabs a#file") as HTMLElement | null)?.click()}
          className="my-1 mr-1 cursor-pointer rounded-lg px-3 text-[13px] font-medium hover:bg-vc-veil-strong">Fichier</button>
        {visible.map((t) => (
          <button key={t.id} role="tab" aria-selected={t.id === current} type="button" onPointerDown={(e) => e.preventDefault()} onClick={() => setTab(t.id)}
            className={`cursor-pointer border-b-2 px-3.5 text-[13px] transition-colors ${t.id === current ? "font-medium text-vc-text" : "border-transparent text-vc-text/60 hover:border-vc-line-strong hover:text-vc-text"}`}
            style={t.id === current ? { borderBottomColor: "var(--vo-edit)" } : undefined}>
            {t.name}
          </button>
        ))}
      </div>
      <div role="toolbar" className="flex min-h-0 flex-1 items-stretch overflow-x-auto overflow-y-hidden px-1.5 py-1.5">
        {current === "home" ? <Home /> : <Mirror tab={current} />}
      </div>
    </div>
  );
}
