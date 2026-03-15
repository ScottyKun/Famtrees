import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { useArbre, useGenerateArbre } from "../../hooks/useArbres";
import type { ArbrePersonne, ArbreUnion } from "../../types";

// ── Carte personne ────────────────────────────────────────────────────────────
function PersonneCard({ person, isRoot }: { person: ArbrePersonne; isRoot: boolean }) {
  const color = person.sexe === "M" ? "border-blue-400" : person.sexe === "F" ? "border-pink-400" : "border-gray-300";
  const bg    = person.sexe === "M" ? "bg-blue-50"      : person.sexe === "F" ? "bg-pink-50"      : "bg-gray-50";
  const initials = `${person.prenom?.[0] ?? ""}${person.nom?.[0] ?? ""}`.toUpperCase();

  return (
    <div className={`relative flex flex-col items-center gap-1 w-28 bg-white rounded-xl border-2 ${color} p-3 shadow-sm ${isRoot ? "ring-2 ring-offset-2 ring-blue-400" : ""}`}>
      <div className={`w-10 h-10 rounded-full ${bg} border ${color} flex items-center justify-center text-sm font-bold text-gray-700`}>
        {initials}
      </div>
      <p className="text-xs font-semibold text-gray-900 text-center leading-tight">
        {person.prenom}
      </p>
      <p className="text-xs text-gray-500 text-center leading-tight">{person.nom}</p>
      {isRoot && (
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full whitespace-nowrap">
          Racine
        </span>
      )}
    </div>
  );
}

// ── Nœud union ────────────────────────────────────────────────────────────────
function UnionNode() {
  return (
    <div className="w-7 h-7 rounded-full bg-amber-50 border-2 border-amber-400 flex items-center justify-center text-amber-500 text-sm font-bold shadow-sm">
      ∞
    </div>
  );
}

// ── Ligne de génération ───────────────────────────────────────────────────────
function GenRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-6">
      <div className="w-28 shrink-0 pt-3 text-right">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</span>
      </div>
      <div className="flex-1 flex flex-wrap items-start gap-6 py-2">
        {children}
      </div>
    </div>
  );
}

// ── Groupe union (conjoints + enfants) ────────────────────────────────────────
function UnionGroup({
  union, persons, rootId,
}: {
  union: ArbreUnion;
  persons: Record<string, ArbrePersonne>;
  rootId: string;
}) {
  const conjoints = union.conjoints.map(id => persons[id]).filter(Boolean);
  const enfants   = union.children.map(id => persons[id]).filter(Boolean);

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Conjoints + nœud union */}
      <div className="flex items-center gap-3">
        {conjoints.map(p => (
          <PersonneCard key={p.id} person={p} isRoot={p.id === rootId} />
        ))}
        {conjoints.length > 0 && (
          <div className="flex flex-col items-center gap-1">
            <div className="w-px h-4 bg-amber-300" />
            <UnionNode />
            {enfants.length > 0 && <div className="w-px h-4 bg-amber-300" />}
          </div>
        )}
      </div>

      {/* Enfants */}
      {enfants.length > 0 && (
        <div className="flex items-start gap-4 relative">
          {/* Ligne horizontale au-dessus des enfants */}
          {enfants.length > 1 && (
            <div className="absolute top-0 left-0 right-0 h-px bg-gray-200"
              style={{ width: `calc(100% - 28px)`, left: "14px" }} />
          )}
          {enfants.map(p => (
            <div key={p.id} className="flex flex-col items-center gap-1">
              <div className="w-px h-4 bg-gray-300" />
              <PersonneCard person={p} isRoot={p.id === rootId} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ArbreViewPage() {
  const { arbreId } = useParams<{ arbreId: string }>();
  const [depth, setDepth] = useState<number | undefined>(undefined);

  const { data: arbreInfo } = useArbre(arbreId ?? "");
  const { data, isLoading, isError } = useGenerateArbre(arbreId ?? "", depth);

  const [scale, setScale] = useState(1);

  const tree    = data?.tree;
  const arbre   = data?.arbre ?? arbreInfo;
  const rootId  = arbre?.racine_id ?? "";

  const sortedGens = tree
    ? Object.keys(tree.generations).map(Number).sort((a, b) => a - b)
    : [];

  const genLabel = (g: number) => {
    if (g === -1) return "Grands-parents";
    if (g === 0)  return "Parents";
    if (g === 1)  return "Enfants";
    if (g === 2)  return "Petits-enfants";
    if (g > 2)    return `Gén. +${g}`;
    return `Ascendants (${Math.abs(g)})`;
  };

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
              <p className="text-xs text-gray-400">Profondeur : {depth ?? arbre.depth}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Profondeur */}
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5">
            <span className="text-xs text-gray-500">Profondeur</span>
            <input type="range" min={1} max={6}
              value={depth ?? arbre?.depth ?? 3}
              onChange={e => setDepth(Number(e.target.value))}
              className="w-20 accent-blue-600" />
            <span className="text-xs font-semibold text-gray-700 w-3">
              {depth ?? arbre?.depth ?? 3}
            </span>
          </div>

          {/* Zoom */}
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
            <button onClick={() => setScale(s => Math.max(0.4, s - 0.1))}
              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md"><ZoomOut size={15} /></button>
            <span className="text-xs text-gray-600 w-10 text-center">{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(s => Math.min(2, s + 0.1))}
              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md"><ZoomIn size={15} /></button>
            <button onClick={() => setScale(1)}
              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md"><RotateCcw size={15} /></button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 bg-white border border-gray-100 rounded-xl overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-sm text-gray-400">
            Génération de l'arbre…
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center h-full text-sm text-red-500">
            Erreur lors de la génération.
          </div>
        ) : !tree ? (
          <div className="flex items-center justify-center h-full text-sm text-gray-400">
            Aucune donnée.
          </div>
        ) : (
          <div
            className="p-8 min-w-max"
            style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}
          >
            <div className="space-y-8">
              {sortedGens.map(gen => {
                const personIds = tree.generations[String(gen)] ?? [];

                // Grouper les personnes par union
                const unionsInGen = Object.values(tree.unions).filter(u =>
                  u.conjoints.some(id => personIds.includes(id))
                );
                const personnesInUnion = new Set(
                  unionsInGen.flatMap(u => u.conjoints)
                );
                // Personnes sans union à cette génération
                const soloIds = personIds.filter(id => !personnesInUnion.has(id));

                return (
                  <GenRow key={gen} label={genLabel(gen)}>
                    {/* Groupes d'union */}
                    {unionsInGen.map(u => (
                      <UnionGroup key={u.id} union={u} persons={tree.persons} rootId={rootId} />
                    ))}
                    {/* Personnes seules */}
                    {soloIds.map(id => {
                      const p = tree.persons[id];
                      return p ? <PersonneCard key={id} person={p} isRoot={id === rootId} /> : null;
                    })}
                  </GenRow>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Légende */}
      <div className="flex items-center gap-4 text-xs text-gray-400">
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full border-2 border-blue-400" /> Homme</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full border-2 border-pink-400" /> Femme</div>
        <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded-full border-2 border-amber-400 flex items-center justify-center text-amber-400 text-[9px]">∞</div> Union</div>
        <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full ring-2 ring-offset-1 ring-blue-400 border border-blue-400" /> Racine</div>
      </div>
    </div>
  );
}