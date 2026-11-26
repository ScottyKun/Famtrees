import type { ArbreDTO, ArbrePersonne } from "../../types";

/*
 * TreeLayout.ts — placement de l'arbre centré sur une personne (focus).
 *
 * Entrée : la sortie Flask /api/tree/<racine> (persons + unions, chaque
 * personne ayant déjà son niveau vertical "generation" et sa classification
 * lineage.py : ROOT / ANCESTOR / DESCENDANT / COLLATERAL / SPOUSE).
 *
 * Trois étapes, toutes déterministes (pas de dépendance à l'ordre des
 * elementId Neo4j) :
 *
 *  1. ORDRE   — ordre gauche→droite de chaque génération, construit à partir
 *               de la lignée : à chaque couple d'ancêtres, la branche du père
 *               part à gauche et celle de la mère à droite ; la fratrie d'un
 *               ancêtre se place du côté extérieur ; la fratrie de la racine
 *               se range par âge autour d'elle. Puis quelques passes de
 *               barycentre (type Sugiyama) qui ne sont gardées que si elles
 *               réduisent le nombre de croisements.
 *  2. X       — placement horizontal "à priorité" : on centre chaque couple
 *               au-dessus de ses enfants et chaque fratrie sous ses parents,
 *               la lignée directe (racine / ancêtres / descendants) étant
 *               prioritaire, les collatéraux s'écartant autour.
 *  3. TRAITS  — un "peigne" par union : trait du couple, point d'union,
 *               descente, barre horizontale, montée vers chaque enfant. Deux
 *               barres qui se chevauchent dans le même intervalle sont mises
 *               sur des hauteurs différentes.
 *
 * Fonction pure (aucune donnée en dur) : elle ne fait que placer ce que renvoie l'API.
 */

export const CARD_W = 84;      // largeur d'une personne (avatar + libellés)
export const CARD_H = 80;      // hauteur d'une personne
export const AVATAR = 44;      // diamètre de l'avatar
export const COUPLE_GAP = 14;  // espace entre les deux personnes d'un couple
export const H_GAP = 30;       // espace minimal entre deux blocs voisins
export const V_GAP = 84;       // espace vertical entre deux générations
export const BUS_STEP = 8;     // décalage vertical entre deux barres qui se chevauchent

export interface PlacedPerson {
  id: string;
  x: number;   // centre horizontal
  y: number;   // haut de la carte
}
export interface UnionDot {
  id: string;
  x: number;
  y: number;   // centre du point
}
export interface Segment {
  x1: number; y1: number; x2: number; y2: number;
}
export interface TreeLayoutResult {
  persons: PlacedPerson[];
  unionDots: UnionDot[];
  segments: Segment[];
  width: number;
  height: number;
  /** ids des personnes par génération, de gauche à droite (haut → bas) */
  rows: string[][];
  /** nb de croisements parent→enfant restants (0 attendu sur un arbre sans consanguinité) */
  crossings: number;
}

interface Block {
  key: string;
  members: string[];   // 1 personne, ou un couple (2+ en cas d'unions multiples)
  level: number;
}
interface LUnion {
  id: string;
  conjoints: string[];
  children: string[];
}
type Seq = Map<number, Block[]>;

const DIRECT_LINE = new Set(["ROOT", "ANCESTOR", "DESCENDANT"]);

export function computeTreeLayout(tree: ArbreDTO, rootId: string): TreeLayoutResult {
  const persons = tree.persons;
  const ids = Object.keys(persons).sort();
  if (!ids.length) {
    return { persons: [], unionDots: [], segments: [], width: 0, height: 0, rows: [], crossings: 0 };
  }

  const level = (id: string) => persons[id].generation ?? 0;
  const birthKey = (id: string) => persons[id].dateNaissance ?? "9999-99-99";
  const byBirth = (a: string, b: string) => birthKey(a).localeCompare(birthKey(b)) || a.localeCompare(b);
  const isDirect = (p: ArbrePersonne) => DIRECT_LINE.has(p.axis ?? "");

  // ── Index des unions (purgées des personnes absentes) ─────────────────────
  const unions: LUnion[] = Object.values(tree.unions)
    .map(u => ({
      id: u.id,
      conjoints: u.conjoints.filter(c => persons[c]).sort(),
      children: u.children.filter(c => persons[c]).sort(byBirth),
    }))
    .filter(u => u.conjoints.length > 0)
    .sort((a, b) => a.id.localeCompare(b.id));

  const birthUnions = new Map<string, LUnion[]>();
  const ownUnions = new Map<string, LUnion[]>();
  for (const u of unions) {
    for (const c of u.children) push(birthUnions, c, u);
    for (const c of u.conjoints) push(ownUnions, c, u);
  }

  // ── Blocs : une personne + son/ses conjoint(s) de même génération ─────────
  const uf = new Map(ids.map(i => [i, i]));
  const find = (i: string): string => {
    let r = i;
    while (uf.get(r) !== r) r = uf.get(r)!;
    uf.set(i, r);
    return r;
  };
  for (const u of unions) {
    for (let i = 1; i < u.conjoints.length; i++) {
      const a = u.conjoints[0], b = u.conjoints[i];
      if (level(a) === level(b)) uf.set(find(b), find(a));
    }
  }
  const groups = new Map<string, string[]>();
  for (const id of ids) push(groups, find(id), id);

  const blockOf = new Map<string, Block>();
  const blocks: Block[] = [];
  for (const members of groups.values()) {
    const b: Block = { key: members[0], members: orderMembers(members), level: level(members[0]) };
    blocks.push(b);
    for (const m of members) blockOf.set(m, b);
  }

  // Ordre initial dans un couple : homme à gauche ; pour 3+ (remariages) la
  // personne la plus mariée au centre, ses conjoints répartis de chaque côté.
  function orderMembers(members: string[]): string[] {
    if (members.length === 1) return members;
    if (members.length === 2) {
      const [a, b] = [...members].sort();
      return persons[b].sexe === "M" && persons[a].sexe !== "M" ? [b, a] : [a, b];
    }
    const deg = (m: string) => (ownUnions.get(m) ?? []).filter(u => u.conjoints.some(c => members.includes(c) && c !== m)).length;
    const hub = [...members].sort((a, b) => deg(b) - deg(a) || a.localeCompare(b))[0];
    const others = members.filter(m => m !== hub).sort(byBirth);
    const half = Math.ceil(others.length / 2);
    return [...others.slice(0, half), hub, ...others.slice(half)];
  }

  // ── 1a. Ordre structurel, construit depuis la racine ──────────────────────
  const placed = new Set<Block>();
  const single = (b: Block): Seq => new Map([[b.level, [b]]]);

  function childBlocks(b: Block): Block[] {
    const kids: string[] = [];
    for (const m of b.members) for (const u of ownUnions.get(m) ?? []) kids.push(...u.children);
    const out: Block[] = [];
    for (const k of [...new Set(kids)].sort(byBirth)) {
      const kb = blockOf.get(k)!;
      if (kb !== b && !out.includes(kb)) out.push(kb);
    }
    return out;
  }

  function desc(b: Block): Seq {
    if (placed.has(b)) return new Map();
    placed.add(b);
    return concat(single(b), ...childBlocks(b).map(desc));
  }

  function parentsBlock(p: string): Block | null {
    for (const u of birthUnions.get(p) ?? []) {
      for (const c of u.conjoints) return blockOf.get(c) ?? null;
    }
    return null;
  }

  function siblingBlocks(p: string): string[] {
    const sibs = new Set<string>();
    for (const u of birthUnions.get(p) ?? []) {
      for (const parent of u.conjoints) {
        for (const pu of ownUnions.get(parent) ?? []) pu.children.forEach(c => sibs.add(c));
      }
    }
    const own = blockOf.get(p);
    return [...sibs].filter(s => blockOf.get(s) !== own).sort(byBirth);
  }

  const descOf = (people: string[]) => concat(...people.map(s => desc(blockOf.get(s)!)));

  /**
   * Tout ce qui se rattache à p par le haut (ses parents, leur ascendance,
   * sa fratrie et leurs descendants), réparti à gauche (L) / au-dessus (col) /
   * à droite (R) de la colonne de p.
   *  side "left"  : p est le père dans le couple du dessous → fratrie à gauche
   *  side "right" : p est la mère → fratrie à droite
   *  side "center": p est la racine → fratrie rangée par âge autour d'elle
   */
  function anc(p: string, side: "left" | "right" | "center"): { L: Seq; col: Seq; R: Seq } {
    const pb = parentsBlock(p);
    if (!pb || placed.has(pb)) return { L: new Map(), col: new Map(), R: new Map() };
    placed.add(pb);
    const first = pb.members[0];
    const last = pb.members[pb.members.length - 1];
    const left = oneSide(first, "left");
    const right = pb.members.length > 1 ? oneSide(last, "right") : new Map();
    const sibs = siblingBlocks(p);
    const col = single(pb);
    if (side === "left") return { L: concat(left, descOf(sibs)), col, R: right };
    if (side === "right") return { L: left, col, R: concat(descOf(sibs), right) };
    const older = sibs.filter(s => byBirth(s, p) < 0);
    const younger = sibs.filter(s => byBirth(s, p) > 0);
    return { L: concat(left, descOf(older)), col, R: concat(descOf(younger), right) };
  }

  function oneSide(p: string, side: "left" | "right"): Seq {
    const r = anc(p, side);
    return concat(r.L, r.col, r.R);
  }

  const focus = persons[rootId] ? rootId : ids[0];
  const rootBlock = blockOf.get(focus)!;
  const top = anc(focus, "center");
  let seq = concat(top.L, top.col, desc(rootBlock), top.R);
  // Filet de sécurité : tout bloc non atteint (données incomplètes) est ajouté à droite.
  for (const b of [...blocks].sort((a, c) => a.level - c.level || a.key.localeCompare(c.key))) {
    if (!placed.has(b)) seq = concat(seq, desc(b));
  }

  const levels = [...seq.keys()].sort((a, b) => a - b);
  let rows: Block[][] = levels.map(l => seq.get(l)!);

  // ── 1b. Réduction des croisements (barycentre, gardé si meilleur) ─────────
  const slot = new Map<string, number>();
  function computeSlots() {
    for (const row of rows) {
      let cursor = 0;
      for (const b of row) {
        b.members.forEach((m, i) => slot.set(m, cursor + i));
        cursor += b.members.length + 0.5;
      }
    }
  }
  const anchorSlot = (u: LUnion) => mean(u.conjoints.map(c => slot.get(c)!));

  function countCrossings(): number {
    computeSlots();
    const byGap = new Map<number, [number, number][]>();
    for (const u of unions) {
      const l = level(u.conjoints[0]);
      const a = anchorSlot(u);
      for (const c of u.children) if (level(c) === l + 1) push(byGap, l, [a, slot.get(c)!]);
    }
    let n = 0;
    for (const edges of byGap.values()) {
      for (let i = 0; i < edges.length; i++)
        for (let j = i + 1; j < edges.length; j++)
          if ((edges[i][0] - edges[j][0]) * (edges[i][1] - edges[j][1]) < 0) n++;
    }
    return n;
  }

  // Dans un couple, la personne "de sang" se met du côté de ses propres parents
  // (le conjoint rapporté part à l'extérieur).
  function flipCouples() {
    computeSlots();
    for (const row of rows) {
      for (const b of row) {
        if (b.members.length !== 2) continue;
        const center = mean(b.members.map(m => slot.get(m)!));
        const pull = b.members.map(m => {
          const us = (birthUnions.get(m) ?? []).filter(u => level(u.conjoints[0]) === b.level - 1);
          return us.length ? mean(us.map(anchorSlot)) : null;
        });
        const [p0, p1] = pull;
        let swap = false;
        if (p0 !== null && p1 !== null) swap = p0 > p1;
        else if (p0 !== null) swap = p0 > center;
        else if (p1 !== null) swap = p1 < center;
        if (swap) b.members.reverse();
      }
    }
  }

  function barySweep(dir: "down" | "up") {
    const order = dir === "down" ? rows.map((_, i) => i).slice(1) : rows.map((_, i) => i).slice(0, -1).reverse();
    for (const r of order) {
      computeSlots();
      const bary = (b: Block): number => {
        const vals: number[] = [];
        for (const m of b.members) {
          if (dir === "down") {
            for (const u of birthUnions.get(m) ?? []) if (level(u.conjoints[0]) === b.level - 1) vals.push(anchorSlot(u));
          } else {
            for (const u of ownUnions.get(m) ?? []) for (const c of u.children) if (level(c) === b.level + 1) vals.push(slot.get(c)!);
          }
        }
        return vals.length ? mean(vals) : mean(b.members.map(m => slot.get(m)!));
      };
      const withB = rows[r].map(b => ({ b, v: bary(b) }));
      withB.sort((x, y) => x.v - y.v);
      rows[r] = withB.map(x => x.b);
    }
  }

  const snapshot = () => ({ rows: rows.map(r => [...r]), members: new Map(blocks.map(b => [b, [...b.members]])) });
  const restore = (s: ReturnType<typeof snapshot>) => {
    rows = s.rows.map(r => [...r]);
    for (const [b, m] of s.members) b.members = [...m];
  };

  flipCouples();
  let best = snapshot();
  let bestCross = countCrossings();
  for (let it = 0; it < 6 && bestCross > 0; it++) {
    barySweep(it % 2 === 0 ? "down" : "up");
    flipCouples();
    const c = countCrossings();
    if (c < bestCross) { bestCross = c; best = snapshot(); }
  }
  restore(best);
  const crossings = countCrossings();

  // ── 2. Positions horizontales ─────────────────────────────────────────────
  const widthOf = (b: Block) => b.members.length * CARD_W + (b.members.length - 1) * COUPLE_GAP;
  const cx = new Map<Block, number>();
  for (const row of rows) {
    let cursor = 0;
    for (const b of row) {
      cx.set(b, cursor + widthOf(b) / 2);
      cursor += widthOf(b) + H_GAP;
    }
  }
  const personX = (p: string) => {
    const b = blockOf.get(p)!;
    const i = b.members.indexOf(p);
    return cx.get(b)! - widthOf(b) / 2 + CARD_W / 2 + i * (CARD_W + COUPLE_GAP);
  };
  const anchorX = (u: LUnion) => mean(u.conjoints.map(personX));
  const childSpanMid = (u: LUnion, lvl: number) => {
    const xs = u.children.filter(c => level(c) === lvl).map(personX);
    return xs.length ? (Math.min(...xs) + Math.max(...xs)) / 2 : null;
  };
  const priorityOf = (b: Block) => {
    const direct = b.members.some(m => isDirect(persons[m]));
    let links = 0;
    for (const m of b.members) {
      links += (birthUnions.get(m) ?? []).length;
      for (const u of ownUnions.get(m) ?? []) links += u.children.length;
    }
    return (direct ? 1000 : 0) + links;
  };

  function placeRow(row: Block[], desired: (number | null)[]) {
    const n = row.length;
    const x = row.map(b => cx.get(b)!);
    const w = row.map(widthOf);
    const dist = (i: number, j: number) => (w[i] + w[j]) / 2 + H_GAP;
    const prio = row.map((b, i) => (desired[i] === null ? -1 : priorityOf(b)));
    const order = row.map((_, i) => i).sort((a, b) => prio[b] - prio[a] || a - b);
    const fixed = new Array(n).fill(false);
    for (const i of order) {
      const target = desired[i];
      if (target !== null && target > x[i]) {
        let lim = Infinity, acc = 0;
        for (let k = i + 1; k < n; k++) {
          acc += dist(k - 1, k);
          if (fixed[k]) { lim = x[k] - acc; break; }
        }
        x[i] = Math.max(x[i], Math.min(target, lim));
        for (let k = i + 1; k < n && x[k] < x[k - 1] + dist(k - 1, k); k++) x[k] = x[k - 1] + dist(k - 1, k);
      } else if (target !== null && target < x[i]) {
        let lim = -Infinity, acc = 0;
        for (let k = i - 1; k >= 0; k--) {
          acc += dist(k, k + 1);
          if (fixed[k]) { lim = x[k] + acc; break; }
        }
        x[i] = Math.min(x[i], Math.max(target, lim));
        for (let k = i - 1; k >= 0 && x[k] > x[k + 1] - dist(k, k + 1); k--) x[k] = x[k + 1] - dist(k, k + 1);
      }
      fixed[i] = true;
    }
    row.forEach((b, i) => cx.set(b, x[i]));
  }

  // Fratries serrées et centrées sous l'union de leurs parents : chaque bloc
  // enfant vise sa place dans la fratrie "compacte" (blocs accolés, H_GAP),
  // ce qui évite qu'une branche collatérale reste étirée vers l'extérieur.
  function downPass() {
    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      const targets = new Map<Block, number[]>();
      const lvl = row[0]?.level;
      for (const u of unions) {
        if (level(u.conjoints[0]) !== lvl - 1) continue;
        const kids = u.children.filter(c => level(c) === lvl);
        if (!kids.length) continue;
        const kidBlocks = row.filter(b => b.members.some(m => kids.includes(m)));
        const packed = new Map<Block, number>();
        let cursor = 0;
        for (const b of kidBlocks) { packed.set(b, cursor + widthOf(b) / 2); cursor += widthOf(b) + H_GAP; }
        const kx = kids.map(k => {
          const b = blockOf.get(k)!;
          return packed.get(b)! - widthOf(b) / 2 + CARD_W / 2 + b.members.indexOf(k) * (CARD_W + COUPLE_GAP);
        });
        const mid = (Math.min(...kx) + Math.max(...kx)) / 2;
        const anchor = anchorX(u);
        for (const b of kidBlocks) push(targets, b, anchor + packed.get(b)! - mid);
      }
      placeRow(row, row.map(b => (targets.has(b) ? mean(targets.get(b)!) : null)));
    }
  }
  // Couples centrés au-dessus de leurs enfants
  function upPass() {
    for (let r = rows.length - 2; r >= 0; r--) {
      const desired = rows[r].map(b => {
        const shifts: number[] = [];
        for (const m of b.members) {
          for (const u of ownUnions.get(m) ?? []) {
            const mid = childSpanMid(u, b.level + 1);
            if (mid !== null) shifts.push(mid - anchorX(u));
          }
        }
        return shifts.length ? cx.get(b)! + mean(shifts) : null;
      });
      placeRow(rows[r], desired);
    }
  }

  for (let it = 0; it < 4; it++) { upPass(); downPass(); }
  upPass();

  // Dernier ajustement des couples, sur les vraies positions : la personne de
  // sang se met du côté de ses parents. Échanger les deux membres d'un couple
  // ne déplace ni le point d'union ni aucun autre bloc.
  for (const b of blocks) {
    if (b.members.length !== 2) continue;
    const center = cx.get(b)!;
    const pull = b.members.map(m => {
      const us = (birthUnions.get(m) ?? []).filter(u => level(u.conjoints[0]) === b.level - 1);
      return us.length ? mean(us.map(anchorX)) : null;
    });
    const [p0, p1] = pull;
    const swap = p0 !== null && p1 !== null ? p0 > p1 + 0.5
      : p0 !== null ? p0 > center + 0.5
      : p1 !== null ? p1 < center - 0.5
      : false;
    if (swap) b.members.reverse();
  }

  // Normalisation : le bloc le plus à gauche commence à x = 0
  let minLeft = Infinity, maxRight = -Infinity;
  for (const b of blocks) {
    if (!cx.has(b)) continue;
    minLeft = Math.min(minLeft, cx.get(b)! - widthOf(b) / 2);
    maxRight = Math.max(maxRight, cx.get(b)! + widthOf(b) / 2);
  }
  for (const b of blocks) if (cx.has(b)) cx.set(b, cx.get(b)! - minLeft);

  // ── 3. Traits ─────────────────────────────────────────────────────────────
  const minLevel = levels[0];
  const rowTop = (l: number) => (l - minLevel) * (CARD_H + V_GAP);
  const placedPersons: PlacedPerson[] = [];
  for (const row of rows) for (const b of row) for (const m of b.members) {
    placedPersons.push({ id: m, x: personX(m), y: rowTop(b.level) });
  }

  const segments: Segment[] = [];
  const unionDots: UnionDot[] = [];
  const buses: { u: LUnion; lvl: number; ox: number; oy: number; lo: number; hi: number; kids: string[] }[] = [];

  for (const u of unions) {
    const lvl = level(u.conjoints[0]);
    const y = rowTop(lvl);
    const xs = u.conjoints.map(personX).sort((a, b) => a - b);
    const sameBlock = u.conjoints.length > 1 && u.conjoints.every(c => blockOf.get(c) === blockOf.get(u.conjoints[0]));
    let ox: number, oy: number;
    if (sameBlock) {
      const yc = y + AVATAR / 2;
      const ax = (xs[0] + xs[xs.length - 1]) / 2;
      segments.push({ x1: xs[0] + AVATAR / 2, y1: yc, x2: xs[xs.length - 1] - AVATAR / 2, y2: yc });
      unionDots.push({ id: u.id, x: ax, y: yc });
      ox = ax; oy = yc + 5;
    } else {
      ox = xs[0]; oy = y + CARD_H;
    }
    const kids = u.children.filter(c => level(c) === lvl + 1);
    if (!kids.length) continue;
    const kx = kids.map(personX);
    buses.push({ u, lvl, ox, oy, lo: Math.min(ox, ...kx), hi: Math.max(ox, ...kx), kids });
  }

  // Une "voie" par barre : deux barres qui se chevauchent n'ont pas la même hauteur
  const byLevel = new Map<number, typeof buses>();
  for (const bus of buses) push(byLevel, bus.lvl, bus);
  for (const [lvl, list] of byLevel) {
    list.sort((a, b) => a.lo - b.lo || a.hi - b.hi);
    const trackEnd: number[] = [];
    const trackOf = list.map(bus => {
      let t = trackEnd.findIndex(end => end < bus.lo - 6);
      if (t === -1) { t = trackEnd.length; trackEnd.push(bus.hi); } else trackEnd[t] = bus.hi;
      return t;
    });
    const base = rowTop(lvl) + CARD_H + V_GAP / 2 - ((trackEnd.length - 1) * BUS_STEP) / 2;
    list.forEach((bus, i) => {
      const by = base + trackOf[i] * BUS_STEP;
      segments.push({ x1: bus.ox, y1: bus.oy, x2: bus.ox, y2: by });
      if (bus.hi > bus.lo) segments.push({ x1: bus.lo, y1: by, x2: bus.hi, y2: by });
      for (const k of bus.kids) {
        const kx = personX(k);
        segments.push({ x1: kx, y1: by, x2: kx, y2: rowTop(lvl + 1) });
      }
    });
  }

  return {
    persons: placedPersons,
    unionDots,
    segments,
    width: maxRight - minLeft,
    height: rowTop(levels[levels.length - 1]) + CARD_H,
    rows: rows.map(r => r.flatMap(b => b.members)),
    crossings,
  };
}

function concat(...seqs: Seq[]): Seq {
  const out: Seq = new Map();
  for (const s of seqs) for (const [l, bs] of s) out.set(l, [...(out.get(l) ?? []), ...bs]);
  return out;
}

function push<K, V>(m: Map<K, V[]>, k: K, v: V) {
  const arr = m.get(k);
  if (arr) arr.push(v); else m.set(k, [v]);
}
function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}
