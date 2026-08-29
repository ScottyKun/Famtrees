import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useArbre, useGenerateArbre } from "../../hooks/useArbres";
import type { TreeAxes } from "../../types";
import FamilyTreeFlow from "./FamilyTreeFlow";

// ── Contrôle d'un axe (up / down / collateral) ─────────────────────────────────
function AxisControl({
  label, value, onChange, max = 6,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  max?: number;
}) {
  return (
    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
      <span className="text-xs text-gray-500">{label}</span>
      <input type="range" min={0} max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-16 accent-blue-600" />
      <span className="text-xs font-semibold text-gray-700 w-3">{value}</span>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ArbreViewPage() {
  const { arbreId } = useParams<{ arbreId: string }>();

  // Les 3 axes indépendants du modèle V2 (voir tree-flask/lineage.py) :
  //   up         : générations d'ascendance (parents, grands-parents...)
  //   down       : générations de descendance (enfants, petits-enfants...)
  //   collateral : fratrie (1), cousins/neveux (2), ...
  const [axes, setAxes] = useState<Required<TreeAxes>>({ up: 1, down: 1, collateral: 1 });

  const { data: arbreInfo } = useArbre(arbreId ?? "");

  // Initialise les sliders sur les valeurs sauvegardées de l'arbre, une seule
  // fois au chargement (n'écrase pas les réglages que l'utilisateur ferait
  // ensuite en cours de session).
  const axesInitialized = useRef(false);
  useEffect(() => {
    if (arbreInfo && !axesInitialized.current) {
      setAxes({
        up: arbreInfo.up_depth,
        down: arbreInfo.down_depth,
        collateral: arbreInfo.collateral_depth,
      });
      axesInitialized.current = true;
    }
  }, [arbreInfo]);

  const { data, isLoading, isError } = useGenerateArbre(arbreId ?? "", axes);

  const tree   = data?.tree;
  const arbre  = data?.arbre ?? arbreInfo;
  const rootId = arbre?.racine_id ?? "";

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Barre supérieure */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link to="/arbres" className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{arbre?.nom ?? "Arbre"}</h1>
            {arbre && (
              <p className="text-xs text-gray-400">
                Ascendance {axes.up} · Descendance {axes.down} · Collatéraux {axes.collateral}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <AxisControl label="Ascendance"  value={axes.up}         onChange={v => setAxes(a => ({ ...a, up: v }))} />
          <AxisControl label="Descendance" value={axes.down}       onChange={v => setAxes(a => ({ ...a, down: v }))} />
          <AxisControl label="Collatéraux" value={axes.collateral} onChange={v => setAxes(a => ({ ...a, collateral: v }))} />
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 bg-white border border-gray-100 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-sm text-gray-400">
            Génération de l'arbre…
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center h-full text-sm text-red-500">
            Erreur lors de la génération.
          </div>
        ) : !tree || !rootId ? (
          <div className="flex items-center justify-center h-full text-sm text-gray-400">
            Aucune donnée.
          </div>
        ) : (
          <FamilyTreeFlow tree={tree} rootId={rootId} />
        )}
      </div>
    </div>
  );
}