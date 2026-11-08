import { useEffect, useState } from "react";
import { backToDocument, getToolbarView, keyGuard } from "./engine";

/** Champ numérique d'origine (retraits, espacements) : lu et écrit sur le contrôle caché. */
export function Spin({ label, field }: { label: string; field: string }) {
  const [v, setV] = useState("");
  const [focus, setFocus] = useState(false);
  useEffect(() => {
    if (focus) return;
    const read = () => { try { setV(String(getToolbarView()[field].getValue() ?? "")); } catch { /* pas prêt */ } };
    read();
    const t = setInterval(read, 700);
    return () => clearInterval(t);
  }, [field, focus]);
  return (
    <label className="flex items-center justify-between gap-2 text-xs text-vc-text/70">
      <span>{label}</span>
      <input
        value={v} onChange={(e) => setV(e.target.value)} aria-label={label}
        onFocus={(e) => { setFocus(true); keyGuard.on(); e.currentTarget.select(); }}
        onBlur={() => { try { getToolbarView()[field].setValue(v); } catch { /* sans effet */ } setFocus(false); keyGuard.off(); backToDocument(); }}
        onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
        className="h-7 w-20 rounded-lg border border-vc-line-strong bg-transparent px-2 text-sm tabular-nums text-vc-text outline-none focus:border-vc-main"
      />
    </label>
  );
}
