import type { ArbreDTO } from "../../types";

export const CARD_W  = 74;    // largeur d'une colonne "personne" (avatar + libellé)
export const CARD_H  = 80;    // hauteur d'un bloc (avatar + libellé sur 2 lignes)
export const AVATAR  = 44;    // diamètre de l'avatar
export const COUPLE_GAP = 16; // espace entre les 2 avatars d'un couple
export const H_GAP   = 36;    // espace horizontal entre deux blocs
export const V_GAP   = 76;    // espace vertical entre deux niveaux

export interface LayoutBlockNode {
  id: string;             // "block:<id du 1er membre>"
  type: "block";
  ids: string[];          // 1 (solo) ou 2 (couple) ids de personnes
  x: number;               // centre horizontal du bloc
  y: number;
  width: number;
}
export interface LayoutEdge {
  id: string;
  source: string;          // id de bloc parent
  target: string;          // id de bloc enfant
}

interface Block {
  ids: string[];
  unionId: string | null;   // union à l'origine des enfants de ce bloc (s'il y en a)
  isRootBlock: boolean;
}

function blockNodeId(b: Block): string {
  return `block:${b.ids[0]}`;
}

function blockWidth(b: Block): number {
  return b.ids.length === 2 ? CARD_W * 2 + COUPLE_GAP : CARD_W;
}

/**
 * Calcule la position de chaque "bloc" (une personne seule, ou un couple
 * réuni dans une seule boîte — comme dans un arbre généalogique classique)
 * ainsi que les arêtes bloc-parent → bloc-enfant.
 *
 * Chaque personne appartient à EXACTEMENT un bloc → aucune duplication
 * visuelle. Les enfants d'une même union sont chacun dans leur propre bloc
 * (avec leur conjoint le cas échéant) et reçoivent tous une arête depuis le
 * bloc de leurs parents, produisant le classique "peigne" généalogique.
 */
export function computeTreeLayout(tree: ArbreDTO, rootId: string): { nodes: LayoutBlockNode[]; edges: LayoutEdge[] } {
  const persons = tree.persons;
  const unions  = tree.unions;

  // ── 1. Grouper les ids par niveau ────────────────────────────
  const levels = new Map<number, string[]>();
  for (const pid of Object.keys(persons)) {
    const lvl = persons[pid].generation ?? 0;
    if (!levels.has(lvl)) levels.set(lvl, []);
    levels.get(lvl)!.push(pid);
  }
  const sortedLevels = [...levels.keys()].sort((a, b) => a - b);

  // ── 2. Union "primaire" par personne (conjoint visible au même niveau) ─
  const primaryUnionOf = new Map<string, string | null>();
  for (const pid of Object.keys(persons)) {
    const p = persons[pid];
    let chosen: string | null = null;
    for (const uid of p.unions) {
      const u = unions[uid];
      if (!u) continue;
      const other = u.conjoints.find(id => id !== pid);
      if (other && persons[other] && persons[other].generation === p.generation) {
        chosen = uid;
        break;
      }
      if (chosen === null) chosen = uid;
    }
    primaryUnionOf.set(pid, chosen);
  }

  // ── 3. Construire les blocks par niveau (ordre déterministe via tri des ids) ─
  const blocksByLevel = new Map<number, Block[]>();
  const blockOfPerson = new Map<string, Block>();
  for (const lvl of sortedLevels) {
    const ids = [...levels.get(lvl)!].sort();
    const blocks: Block[] = [];
    const consumed = new Set<string>();
    for (const pid of ids) {
      if (consumed.has(pid)) continue;
      const uid = primaryUnionOf.get(pid) ?? null;
      let partner: string | null = null;
      if (uid) {
        const u = unions[uid];
        partner = u.conjoints.find(
          id => id !== pid && persons[id] && persons[id].generation === lvl && !consumed.has(id)
        ) ?? null;
      }
      const isRootBlock = pid === rootId || partner === rootId;
      const block: Block = { ids: partner ? [pid, partner] : [pid], unionId: uid, isRootBlock };
      consumed.add(pid);
      if (partner) consumed.add(partner);
      blocks.push(block);
      for (const id of block.ids) blockOfPerson.set(id, block);
    }
    blocksByLevel.set(lvl, blocks);
  }

  const levelX = new Map<number, Map<string, number>>(); // level -> personId -> x-center du bloc

  function placeLevel(lvl: number, orderedBlocks: Block[]) {
    let cursor = 0;
    const xmap = new Map<string, number>();
    for (const b of orderedBlocks) {
      const cx = cursor + blockWidth(b) / 2;
      for (const id of b.ids) xmap.set(id, cx);
      cursor += blockWidth(b) + H_GAP;
    }
    levelX.set(lvl, xmap);
  }

  // Ancre = moyenne des X déjà connus d'un niveau adjacent (vers 0)
  function anchorX(block: Block, towardLevel: number): number | null {
    const towardMap = levelX.get(towardLevel);
    if (!towardMap) return null;
    const xs: number[] = [];
    for (const pid of block.ids) {
      for (const uid of Object.keys(unions)) {
        const u = unions[uid];
        if (u.children.includes(pid)) {
          for (const cid of u.conjoints) {
            const x = towardMap.get(cid);
            if (x !== undefined) xs.push(x);
          }
        }
      }
      const p = persons[pid];
      for (const uid of p.unions) {
        const u = unions[uid];
        if (!u) continue;
        for (const cid of u.children) {
          const x = towardMap.get(cid);
          if (x !== undefined) xs.push(x);
        }
      }
    }
    if (!xs.length) return null;
    return xs.reduce((a, b) => a + b, 0) / xs.length;
  }

  function sortByAnchor(blocks: Block[], towardLevel: number): Block[] {
    const withAnchor = blocks.map(b => ({ b, a: anchorX(b, towardLevel) }));
    withAnchor.sort((x, y) => {
      if (x.a === null && y.a === null) return x.b.ids[0].localeCompare(y.b.ids[0]);
      if (x.a === null) return 1;
      if (y.a === null) return -1;
      return x.a - y.a;
    });
    return withAnchor.map(x => x.b);
  }

  // ── 4. Placer niveau 0, puis étendre vers le bas puis vers le haut ──
  const level0 = blocksByLevel.get(0) ?? [];
  level0.sort((a, b) =>
    (b.isRootBlock ? 1 : 0) - (a.isRootBlock ? 1 : 0) || a.ids[0].localeCompare(b.ids[0])
  );
  if (level0.length) placeLevel(0, level0);

  for (const lvl of sortedLevels.filter(l => l > 0).sort((a, b) => a - b)) {
    placeLevel(lvl, sortByAnchor(blocksByLevel.get(lvl)!, lvl - 1));
  }
  for (const lvl of sortedLevels.filter(l => l < 0).sort((a, b) => b - a)) {
    placeLevel(lvl, sortByAnchor(blocksByLevel.get(lvl)!, lvl + 1));
  }

  // ── 5. Construire les nodes de bloc + les arêtes bloc→bloc ──────
  const nodes: LayoutBlockNode[] = [];
  const edges: LayoutEdge[] = [];

  for (const lvl of sortedLevels) {
    const xmap = levelX.get(lvl)!;
    for (const b of blocksByLevel.get(lvl)!) {
      const x = xmap.get(b.ids[0])!;
      nodes.push({ id: blockNodeId(b), type: "block", ids: b.ids, x, y: lvl * (CARD_H + V_GAP), width: blockWidth(b) });

      if (b.unionId && unions[b.unionId]) {
        for (const cid of unions[b.unionId].children) {
          const childBlock = blockOfPerson.get(cid);
          if (childBlock) {
            edges.push({ id: `${blockNodeId(b)}->${blockNodeId(childBlock)}`, source: blockNodeId(b), target: blockNodeId(childBlock) });
          }
        }
      }
    }
  }

  return { nodes, edges };
}