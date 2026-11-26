import { useMemo } from "react";
import ReactFlow, { Background, Controls, type Node, type NodeProps } from "reactflow";
import "reactflow/dist/style.css";
import type { ArbreDTO, ArbrePersonne } from "../../types";
import { computeTreeLayout, CARD_W, CARD_H, AVATAR, type TreeLayoutResult } from "./TreeLayout";

// Un conjoint "rapporté" (marié dans la famille, hors lignée de sang de la
// racine) a un anneau pointillé gris — voir lineage.py : axis === "SPOUSE".
const SPOUSE_RING = "#9ca3af";
const LINE = "#b6bdc8";

function isBloodline(p: ArbrePersonne): boolean {
  return p.axis !== "SPOUSE";
}

function ringColor(p: ArbrePersonne): string {
  if (!isBloodline(p)) return SPOUSE_RING;
  return p.sexe === "M" ? "#378ADD" : p.sexe === "F" ? "#D4537E" : SPOUSE_RING;
}

// ── Une personne : avatar + prénom + nom ─────────────────────────────────────
function PersonNode({ data }: NodeProps<{ person: ArbrePersonne; isRoot: boolean }>) {
  const { person, isRoot } = data;
  const bloodline = isBloodline(person);
  const initials = `${person.prenom?.[0] ?? ""}${person.nom?.[0] ?? ""}`.toUpperCase();
  const year = person.dateNaissance?.slice(0, 4);

  return (
    <div
      className="relative flex flex-col items-center"
      style={{ width: CARD_W, height: CARD_H }}
      title={`${person.prenom} ${person.nom}${year ? ` · ${year}` : ""}`}
    >
      {isRoot && (
        <span className="absolute -top-4 text-[9px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full whitespace-nowrap">
          Racine
        </span>
      )}
      <div
        className={`rounded-full flex items-center justify-center text-xs font-semibold text-gray-800 ${isRoot ? "bg-blue-50" : "bg-white"}`}
        style={{
          width: AVATAR, height: AVATAR,
          border: `2px ${bloodline ? "solid" : "dashed"} ${ringColor(person)}`,
          boxShadow: isRoot ? "0 0 0 4px #dbeafe" : undefined,
        }}
      >
        {initials}
      </div>
      <p className="text-[11px] font-semibold text-gray-900 leading-tight mt-1 text-center truncate w-full">{person.prenom}</p>
      <p className={`text-[10px] leading-tight text-center truncate w-full ${bloodline ? "text-gray-500" : "text-gray-400"}`}>{person.nom}</p>
    </div>
  );
}

// ── Calque des traits (couples, points d'union, peignes parents → enfants) ──
// Un seul SVG pour tout l'arbre : les traits viennent tels quels de TreeLayout,
// React Flow ne fait que le zoom / déplacement.
function LinksNode({ data }: NodeProps<{ layout: TreeLayoutResult }>) {
  const { layout } = data;
  return (
    <svg
      width={layout.width}
      height={layout.height}
      style={{ overflow: "visible", pointerEvents: "none", display: "block" }}
      aria-hidden="true"
    >
      {layout.segments.map((s, i) => (
        <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={LINE} strokeWidth={1.5} strokeLinecap="round" />
      ))}
      {layout.unionDots.map(d => (
        <circle key={d.id} cx={d.x} cy={d.y} r={4} fill="#fff" stroke={LINE} strokeWidth={1.5} />
      ))}
    </svg>
  );
}

const nodeTypes = { person: PersonNode, links: LinksNode };

export default function FamilyTreeFlow({ tree, rootId }: { tree: ArbreDTO; rootId: string }) {
  const nodes = useMemo<Node[]>(() => {
    const layout = computeTreeLayout(tree, rootId);
    const links: Node = {
      id: "__links__",
      type: "links",
      position: { x: 0, y: 0 },
      data: { layout },
      draggable: false,
      selectable: false,
      zIndex: 0,
      style: { pointerEvents: "none" },
    };
    const people: Node[] = layout.persons.map(p => ({
      id: p.id,
      type: "person",
      position: { x: p.x - CARD_W / 2, y: p.y },
      data: { person: tree.persons[p.id], isRoot: p.id === rootId },
      draggable: false,
      zIndex: 1,
    }));
    return [links, ...people];
  }, [tree, rootId]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 min-h-0">
        <ReactFlow
          nodes={nodes}
          edges={[]}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.2}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
          nodesConnectable={false}
          elementsSelectable={false}
        >
          <Background gap={24} color="#f1f5f9" />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
      <div className="flex items-center gap-4 px-1 pt-2 text-[11px] text-gray-500 shrink-0">
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full border-2 border-blue-400" /> Lien de sang</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full border-2 border-dashed border-gray-400" /> Conjoint rapporté</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full border border-gray-400 bg-white" /> Union</div>
      </div>
    </div>
  );
}
