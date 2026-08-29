import { useMemo } from "react";
import ReactFlow, {
  Background, Controls, Handle, Position,
  type Node, type Edge, type NodeProps,
} from "reactflow";
import "reactflow/dist/style.css";
import type { ArbreDTO, ArbrePersonne } from "../../types";
import { computeTreeLayout, CARD_W, CARD_H, AVATAR, COUPLE_GAP } from "./TreeLayout";

// Un conjoint "rapporté" (marié dans la famille, hors lignée de sang de la
// racine) est reconnaissable à son anneau pointillé gris — voir lineage.py :
// axis === "SPOUSE" signifie que la personne n'est là que par alliance.
function isBloodline(p: ArbrePersonne): boolean {
  return p.axis !== "SPOUSE";
}

function ringColor(p: ArbrePersonne): string {
  if (!isBloodline(p)) return "var(--border-stronger)";
  return p.sexe === "M" ? "#378ADD" : p.sexe === "F" ? "#D4537E" : "var(--border-stronger)";
}

// ── Une personne (avatar + libellé, sans encadré) ────────────────────────────
function PersonCell({ person, isRoot }: { person: ArbrePersonne; isRoot: boolean }) {
  const bloodline = isBloodline(person);
  const initials = `${person.prenom?.[0] ?? ""}${person.nom?.[0] ?? ""}`.toUpperCase();

  return (
    <div className="relative flex flex-col items-center" style={{ width: CARD_W }}>
      {isRoot && (
        <span className="absolute -top-2.5 text-[9px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full whitespace-nowrap">
          Racine
        </span>
      )}
      <div
        className="rounded-full bg-white flex items-center justify-center text-xs font-semibold text-gray-800"
        style={{
          width: AVATAR, height: AVATAR,
          border: bloodline ? `2px solid ${ringColor(person)}` : `2px dashed ${ringColor(person)}`,
        }}
      >
        {initials}
      </div>
      <p className="text-[11px] font-semibold text-gray-900 leading-tight mt-1 text-center truncate w-full">{person.prenom}</p>
      <p className={`text-[10px] leading-tight text-center truncate w-full ${bloodline ? "text-gray-500" : "text-gray-400"}`}>{person.nom}</p>
    </div>
  );
}

// ── Bloc : une personne seule, ou un couple (2 avatars + petit connecteur) ──
function BlockNode({ data }: NodeProps<{ persons: ArbrePersonne[]; rootId: string }>) {
  const { persons, rootId } = data;
  const isCouple = persons.length === 2;

  return (
    <div className="relative flex items-start" style={{ gap: isCouple ? COUPLE_GAP : 0, height: CARD_H }}>
      <Handle type="target" position={Position.Top} className="!bg-gray-300 !w-1.5 !h-1.5 !border-0 !top-5" />
      {isCouple && (
        <div className="absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white border border-gray-300" style={{ top: AVATAR / 2 - 4 }} />
      )}
      {persons.map(p => (
        <PersonCell key={p.id} person={p} isRoot={p.id === rootId} />
      ))}
      <Handle type="source" position={Position.Bottom} className="!bg-gray-300 !w-1.5 !h-1.5 !border-0" />
    </div>
  );
}

const nodeTypes = { block: BlockNode };

export default function FamilyTreeFlow({ tree, rootId }: { tree: ArbreDTO; rootId: string }) {
  const { nodes, edges } = useMemo(() => {
    const layout = computeTreeLayout(tree, rootId);

    const rfNodes: Node[] = layout.nodes.map(n => ({
      id: n.id,
      type: "block",
      position: { x: n.x - n.width / 2, y: n.y - CARD_H / 2 },
      data: { persons: n.ids.map(id => tree.persons[id]).filter(Boolean), rootId },
      draggable: false,
      style: { width: n.width },
    }));

    const rfEdges: Edge[] = layout.edges.map(e => ({
      id: e.id,
      source: e.source,
      target: e.target,
      type: "smoothstep",
      pathOptions: { borderRadius: 10 },
      style: { stroke: "#d1d5db", strokeWidth: 1.25 },
    }));

    return { nodes: rfNodes, edges: rfEdges };
  }, [tree, rootId]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 min-h-0">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
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
      <div className="flex items-center gap-4 px-1 pt-2 text-[11px] text-gray-400 shrink-0">
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full border-2 border-blue-400" /> Lien de sang</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full border-2 border-dashed border-gray-400" /> Conjoint rapporté</div>
      </div>
    </div>
  );
}