/* eslint-disable @typescript-eslint/no-explicit-any */
// Pont vers les contrôles d'origine (ONLYOFFICE) : tout ce qui n'est pas réécrit en natif reste utilisable, avec NOTRE habillage.
// Un clic sur notre bouton déclenche le vrai bouton (caché) ; si un menu s'ouvre, on le repositionne sous notre bouton.

/* eslint-disable @typescript-eslint/no-explicit-any */
let lastRect: DOMRect | null = null;
document.addEventListener("pointerdown", (e) => {
  const t = e.composedPath().find((n) => n instanceof HTMLElement && (n.tagName === "BUTTON" || n.getAttribute("role") === "tab")) as HTMLElement | undefined;
  if (t) lastRect = ((t.closest('[data-anchor]') as HTMLElement | null) ?? t).getBoundingClientRect();
}, true);

const slotOf = (icon: string): HTMLElement | null => {
  const i = document.querySelector(`#toolbar .toolbar .panel i.toolbar__icon.${CSS.escape(icon)}`);
  return (i?.closest(".btn-slot") as HTMLElement | null) ?? null;
};

/** Place le menu d'origine ouvert sous le dernier bouton cliqué (position fixe : échappe au rognage du ruban masqué). */
export function placeOpenMenu(root: ParentNode, anchor: DOMRect | null = lastRect): void {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const menus = [...root.querySelectorAll<HTMLElement>(":scope .dropdown-menu, .dropdown-menu")].filter((m) => !m.closest(".dropdown-submenu") && m.getClientRects().length > 0);
    const menu = menus[0];
    if (!menu || !anchor) return;
    const h = menu.offsetHeight, wd = menu.offsetWidth;
    const left = Math.max(8, Math.min(anchor.left, window.innerWidth - wd - 8));
    const top = anchor.bottom + 6 + h > window.innerHeight ? Math.max(8, anchor.top - h - 6) : anchor.bottom + 6;
    Object.assign(menu.style, { position: "fixed", left: `${left}px`, top: `${top}px`, right: "auto", bottom: "auto", margin: "0", transform: "none", zIndex: "10000" });
  }));
}

/** Déclenche le contrôle d'origine repéré par la classe de son icône. `menu` : ouvre sa liste plutôt que l'action principale. */
export function bridgeClick(icon: string, opts: { menu?: boolean } = {}): void {
  const slot = slotOf(icon);
  if (!slot) { console.warn("[vo-ui] contrôle d'origine introuvable :", icon); return; }
  clickSlot(slot, opts.menu === true);
}

export function clickSlot(slot: HTMLElement, menu: boolean): void {
  const toggle = slot.querySelector<HTMLElement>("button.dropdown-toggle");
  const main = slot.querySelector<HTMLElement>("button.btn:not(.dropdown-toggle)");
  const target = menu ? (toggle ?? main) : (main ?? toggle);
  if (!target) return;
  target.click();
  if (target === toggle || (menu && target)) placeOpenMenu(slot);
}

/** Contrôle d'origine repéré par l'identifiant de son emplacement (`slot-btn-instable`…). */
export function bridgeSlot(id: string, opts: { menu?: boolean } = {}): boolean {
  const slot = document.getElementById(`slot-${id}`) as HTMLElement | null;
  if (!slot) { console.warn("[vo-ui] emplacement d'origine introuvable :", id); return false; }
  clickSlot(slot, opts.menu === true);
  return true;
}

/** Contrôle d'origine repéré par un mot de sa classe d'icône (les boutons injectés par d'autres contrôleurs n'ont pas d'emplacement fixe). */
export function bridgeIcon(tokens: string[], opts: { menu?: boolean } = {}): boolean {
  for (const t of tokens) {
    const i = document.querySelector(`#toolbar .toolbar i.toolbar__icon[class*="${CSS.escape(t)}"], #statusbar i.toolbar__icon[class*="${CSS.escape(t)}"]`);
    const el = (i?.closest(".btn-slot, .btn-group, .btn") as HTMLElement | null);
    if (el) { clickSlot((el.closest(".btn-slot") as HTMLElement) ?? el, opts.menu === true); return true; }
  }
  console.warn("[vo-ui] contrôle d'origine introuvable :", tokens.join(","));
  return false;
}

/** Ouvre un panneau du menu Fichier d'origine (enregistrer sous, infos, paramètres…). */
export function openFileMenu(panel?: string): void {
  try { ((window as any).DE ?? (window as any).SSE ?? (window as any).PE).getController("LeftMenu").leftMenu.showMenu("file", panel); } catch { /* sans effet */ }
}

/** Active l'onglet d'origine correspondant (les panneaux des onglets inactifs sont masqués : leurs menus n'auraient aucune taille). */
export function activateOriginalTab(ourTab: string): void {
  const map: Record<string, string> = { home: "home", insert: "ins", layout: "layout", refs: "links", review: "review", view: "view", formula: "formula", data: "data", design: "design", transit: "transit", animate: "animate" };
  const key = map[ourTab];
  if (!key) return;
  (document.querySelector(`#toolbar .tabs a[data-tab="${key}"]`) as HTMLElement | null)?.click();
}

export interface OrigState { found: boolean; active: boolean; disabled: boolean }
/** Élément d'origine d'un bouton : emplacement (`slot`) ou classe d'icône (`tokens`). */
export function findOriginal(slot?: string, tokens?: string[], query?: string): HTMLElement | null {
  if (query) { const e = document.querySelector<HTMLElement>(query); return e ? ((e.closest(".btn-slot") as HTMLElement | null) ?? e) : null; }
  if (slot) return document.getElementById(`slot-${slot}`);
  for (const t of tokens ?? []) {
    const i = document.querySelector(`#toolbar .toolbar i.toolbar__icon[class*="${CSS.escape(t)}"], #statusbar i.toolbar__icon[class*="${CSS.escape(t)}"]`);
    const el = i?.closest(".btn-group, button") as HTMLElement | null;
    if (el) return (el.closest(".btn-slot") as HTMLElement | null) ?? el;
  }
  return null;
}
export function readOriginal(el: HTMLElement | null): OrigState {
  if (!el) return { found: false, active: false, disabled: false };
  const btn = el.querySelector<HTMLElement>("button.btn:not(.dropdown-toggle)") ?? el.querySelector<HTMLElement>("button.btn") ?? (el.matches("button") ? el : null);
  const group = el.querySelector(".btn-group");
  return {
    found: true,
    active: !!(btn?.classList.contains("active") || group?.classList.contains("active")),
    disabled: !!(btn?.hasAttribute("disabled") || btn?.classList.contains("disabled") || el.classList.contains("disabled")),
  };
}
/** Texte affiché par un champ d'origine (police, taille, format de nombre…). */
export function readField(slot: string): string {
  const el = document.getElementById(`slot-${slot}`);
  return (el?.querySelector<HTMLInputElement>("input")?.value ?? "").trim();
}

/** Contrôle d'origine repéré par un sélecteur CSS (galeries sans emplacement fixe). */
export function bridgeQuery(query: string, opts: { menu?: boolean } = {}): boolean {
  const el = findOriginal(undefined, undefined, query);
  if (!el) { console.warn("[vo-ui] contrôle d'origine introuvable :", query); return false; }
  clickSlot(el, opts.menu === true);
  return true;
}
