// BANC D'ESSAI (développement seulement) : monte la vraie coque avec un faux moteur, pour juger la mise en page sans Document Server.
// Les valeurs ci-dessous n'existent QUE ici ; en production tout vient du moteur (engine.ts / doc.ts).
import { createRoot } from "react-dom/client";
import { ToastProvider, VolcaniumProvider } from "@volcanium/volcanium-components";
import css from "../ui.css?inline";
import Shell from "../Shell";
import { set } from "../engine";
import { setDoc } from "../doc";

/* eslint-disable @typescript-eslint/no-explicit-any */
const noop = new Proxy({}, { get: () => () => undefined });
const styles = ["Normal", "Titre 1", "Titre 2", "Titre 3", "Sous-titre"].map((t) => ({ get: (k: string) => (k === "title" ? t : "") }));
(window as any).DE = { getController: () => ({ api: Object.assign(noop, { asc_registerCallback: () => undefined, put_TextPrBold: () => undefined }), toolbar: { cmbFontName: { store: { pluck: () => ["Arimo", "DM Sans", "Liberation Serif", "Rammetto One"] } }, listStyles: { menuPicker: { store: { models: styles } } } } }), getCollection: () => ({ models: [] }) };

set({ align: 1, size: 11, fontName: "Arimo", style: "Normal", undo: true, redo: false, zoom: 100 });
setDoc({
  title: "Note d’intention — Horizon", modified: false, page: 1, pages: 1, words: 247, lang: "Français (France)",
  users: [{ id: "1", name: "Marie Legrand" }, { id: "2", name: "Antoine Dubois" }],
  outline: [{ index: 0, text: "Faire grandir les idées utiles.", level: 0 }, { index: 1, text: "Notre ambition", level: 1 }, { index: 2, text: "Les principes du projet", level: 1 }, { index: 3, text: "La suite, ensemble", level: 1 }],
  outlineAt: 1,
  comments: [
    { id: "1", uid: "1", author: "Marie Legrand", initials: "ML", time: "Aujourd’hui, 10:28", quote: "Faire grandir les idées utiles.", text: "J’aime beaucoup cette direction. On sent bien notre volonté de rendre le numérique plus accessible.", resolved: false,
      replies: [{ id: "r1", author: "Camille Laurent", initials: "CL", time: "10:42", text: "Tout à fait ! Je garde cette intention pour la suite." }] },
    { id: "2", uid: "2", author: "Antoine Dubois", initials: "AD", time: "Aujourd’hui, 10:35", quote: "Écouter leurs habitudes", text: "Prévoyons quelques entretiens avec les associations partenaires pour nourrir cette première phase.", resolved: false, replies: [] },
  ],
});

const Page = () => (
  <div className="mx-auto h-full w-[760px] max-w-full overflow-hidden border border-white/10 bg-[#111] p-16 text-[#f4f4f5]" style={{ fontFamily: "Arimo,sans-serif" }}>
    <div className="text-xs tracking-widest text-orange-400">■ HORIZON</div>
    <h1 className="mt-8 text-6xl font-black leading-[0.95]" style={{ fontFamily: "'Rammetto One',sans-serif" }}>Faire grandir les idées utiles.</h1>
    <p className="mt-6 text-sm opacity-70">Un numérique plus simple, plus ouvert, plus humain.</p>
  </div>
);
const host = document.getElementById("app")!;
const shadow = host.attachShadow({ mode: "open" });
const style = document.createElement("style"); style.textContent = css;
const wrap = document.createElement("div");
wrap.setAttribute("data-theme", new URLSearchParams(location.search).get("theme") ?? "dark"); wrap.style.cssText = "height:100%;background:#0f0f10";
shadow.append(style, wrap);
createRoot(wrap).render(<VolcaniumProvider config={{ lang: "fr" }}><ToastProvider><Shell stage={<Page />} /></ToastProvider></VolcaniumProvider>);
