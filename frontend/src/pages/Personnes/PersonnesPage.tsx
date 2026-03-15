import { useState } from "react";
import { Plus, Pencil, Trash2, Search, ChevronRight, X, UserPlus, Link2, Users } from "lucide-react";
import {
  usePersonnes, useCreatePersonne, useUpdatePersonne, useDeletePersonne
} from "../../hooks/usePersonnes";
import { useFamilles } from "../../hooks/useFamilles";
import { useUnions }   from "../../hooks/useUnions";
import { personneService } from "../../services/personneService";
import { useQueryClient } from "@tanstack/react-query";
import { PERSONNES_KEY } from "../../hooks/usePersonnes";
import type { Personne, PersonnePayload } from "../../types";
import Modal from "../../components/ui/Modal";
import { Input, Select, Button, ConfirmDialog } from "../../components/ui/FormElements";

// ── Formulaire personne ───────────────────────────────────────────────────────
function PersonneForm({ initial, onSubmit, onCancel, loading }: {
  initial?: Personne; onSubmit: (d: PersonnePayload) => void;
  onCancel: () => void; loading: boolean;
}) {
  const [form, setForm] = useState<PersonnePayload>({
    prenom: initial?.prenom ?? "", nom: initial?.nom ?? "",
    sexe: initial?.sexe ?? "M",
    dateNaissance: initial?.dateNaissance ?? null,
    dateDeces: initial?.dateDeces ?? null,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof PersonnePayload, string>>>({});
  const set = (k: keyof PersonnePayload, v: string) => setForm(f => ({ ...f, [k]: v || null }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err: typeof errors = {};
    if (!form.prenom.trim()) err.prenom = "Requis";
    if (!form.nom.trim())    err.nom    = "Requis";
    setErrors(err);
    if (!Object.keys(err).length) onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Prénom" required value={form.prenom} onChange={e => set("prenom", e.target.value)} error={errors.prenom} />
        <Input label="Nom"    required value={form.nom}    onChange={e => set("nom",    e.target.value)} error={errors.nom} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Date de naissance" type="date" value={form.dateNaissance ?? ""} onChange={e => set("dateNaissance", e.target.value)} />
        <Input label="Date de décès"     type="date" value={form.dateDeces ?? ""}     onChange={e => set("dateDeces",     e.target.value)} />
      </div>
      <Select label="Genre" required value={form.sexe} onChange={e => set("sexe", e.target.value)}
        options={[{ value: "M", label: "Homme" }, { value: "F", label: "Femme" }]} />
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>Annuler</Button>
        <Button type="submit" loading={loading}>{initial ? "Enregistrer" : "Ajouter"}</Button>
      </div>
    </form>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
function Tabs({ tabs, active, onChange }: {
  tabs: string[]; active: string; onChange: (t: string) => void;
}) {
  return (
    <div className="flex border-b border-gray-100 mb-4">
      {tabs.map(t => (
        <button key={t} onClick={() => onChange(t)}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            active === t
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}>
          {t}
        </button>
      ))}
    </div>
  );
}

// ── Liste relation générique ───────────────────────────────────────────────────
function RelationList({ items, onRemove, removeLoading, emptyMsg }: {
  items: { id: string; label: string; sublabel?: string }[];
  onRemove: (id: string) => void;
  removeLoading: boolean;
  emptyMsg: string;
}) {
  if (!items.length) return <p className="text-sm text-gray-400 py-4 text-center">{emptyMsg}</p>;
  return (
    <div className="space-y-2">
      {items.map(item => (
        <div key={item.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2.5">
          <div>
            <p className="text-sm font-medium text-gray-800">{item.label}</p>
            {item.sublabel && <p className="text-xs text-gray-400">{item.sublabel}</p>}
          </div>
          <button onClick={() => onRemove(item.id)} disabled={removeLoading}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Modal détail personne ─────────────────────────────────────────────────────
function PersonneDetailModal({ personne, onClose }: { personne: Personne; onClose: () => void }) {
  const [tab, setTab]               = useState("Enfants");
  const [loading, setLoading]       = useState(false);
  const [showAddEnfant, setShowAddEnfant] = useState(false);
  const [showLinkUnion, setShowLinkUnion] = useState(false);
  const [showLinkFamille, setShowLinkFamille] = useState(false);
  const [selectedUnionId, setSelectedUnionId]   = useState("");
  const [selectedFamilleId, setSelectedFamilleId] = useState("");

  const qc = useQueryClient();
  const { data: personnes } = usePersonnes();
  const { data: unions }    = useUnions();
  const { data: familles }  = useFamilles();

  const refresh = () => qc.invalidateQueries({ queryKey: PERSONNES_KEY });

  const pName = (id: string) => {
    const p = personnes?.find(x => x.id === id);
    return p ? `${p.prenom} ${p.nom}` : id;
  };

  // Enfants
  const enfants = (personne.enfantsIds ?? []).map(id => ({
    id, label: pName(id),
    sublabel: personnes?.find(x => x.id === id)?.dateNaissance ?? undefined,
  }));

  // Unions
  const unionItems = (personne.unionsIds ?? []).map(id => {
    const u = unions?.find(x => x.id === id);
    return { id, label: u?.libelle ?? id, sublabel: u?.type };
  });

  // Familles
  const familleItems = (personne.familleId ?? []).map(id => {
    const f = familles?.find(x => x.id === id);
    return { id, label: f?.nom ?? id };
  });

  const withLoading = async (fn: () => Promise<unknown>) => {
    setLoading(true);
    try { await fn(); await refresh(); } finally { setLoading(false); }
  };

  return (
    <Modal open onClose={onClose}
      title={`${personne.prenom} ${personne.nom}`}
      subtitle="Gestion des relations">
      <Tabs tabs={["Enfants", "Unions", "Familles"]} active={tab} onChange={setTab} />

      {/* ── Enfants ── */}
      {tab === "Enfants" && (
        <div className="space-y-3">
          <RelationList
            items={enfants}
            onRemove={id => withLoading(() => personneService.removeEnfant(personne.id, id))}
            removeLoading={loading}
            emptyMsg="Aucun enfant enregistré" />

          {showAddEnfant ? (
            <div className="border border-gray-100 rounded-xl p-4 space-y-3">
              <p className="text-sm font-medium text-gray-700">Lier un enfant existant</p>
              <select value={selectedUnionId} onChange={e => setSelectedUnionId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 outline-none">
                <option value="">— Sélectionner une personne —</option>
                {(personnes ?? []).filter(p => p.id !== personne.id).map(p => (
                  <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setShowAddEnfant(false)} disabled={loading}>Annuler</Button>
                <Button loading={loading} onClick={() => {
                  if (!selectedUnionId) return;
                  withLoading(() => personneService.linkEnfant(personne.id, selectedUnionId))
                    .then(() => setShowAddEnfant(false));
                }}>Lier</Button>
              </div>
            </div>
          ) : (
            <Button variant="secondary" onClick={() => setShowAddEnfant(true)}>
              <UserPlus size={14} /> Ajouter un enfant
            </Button>
          )}
        </div>
      )}

      {/* ── Unions ── */}
      {tab === "Unions" && (
        <div className="space-y-3">
          <RelationList
            items={unionItems}
            onRemove={id => withLoading(() => personneService.removeUnion(personne.id, id))}
            removeLoading={loading}
            emptyMsg="Aucune union enregistrée" />

          {showLinkUnion ? (
            <div className="border border-gray-100 rounded-xl p-4 space-y-3">
              <p className="text-sm font-medium text-gray-700">Lier à une union existante</p>
              <select value={selectedUnionId} onChange={e => setSelectedUnionId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 outline-none">
                <option value="">— Sélectionner une union —</option>
                {(unions ?? []).filter(u => !personne.unionsIds?.includes(u.id)).map(u => (
                  <option key={u.id} value={u.id}>{u.libelle}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setShowLinkUnion(false)} disabled={loading}>Annuler</Button>
                <Button loading={loading} onClick={() => {
                  if (!selectedUnionId) return;
                  withLoading(() => personneService.linkUnion(personne.id, selectedUnionId))
                    .then(() => setShowLinkUnion(false));
                }}>Lier</Button>
              </div>
            </div>
          ) : (
            <Button variant="secondary" onClick={() => setShowLinkUnion(true)}>
              <Link2 size={14} /> Lier à une union
            </Button>
          )}
        </div>
      )}

      {/* ── Familles ── */}
      {tab === "Familles" && (
        <div className="space-y-3">
          <RelationList
            items={familleItems}
            onRemove={() => {}} // pas de remove famille côté personne dans l'API
            removeLoading={false}
            emptyMsg="Aucune famille" />

          {showLinkFamille ? (
            <div className="border border-gray-100 rounded-xl p-4 space-y-3">
              <p className="text-sm font-medium text-gray-700">Rejoindre une famille</p>
              <select value={selectedFamilleId} onChange={e => setSelectedFamilleId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 outline-none">
                <option value="">— Sélectionner une famille —</option>
                {(familles ?? []).filter(f => !personne.familleId?.includes(f.id)).map(f => (
                  <option key={f.id} value={f.id}>{f.nom}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setShowLinkFamille(false)} disabled={loading}>Annuler</Button>
                <Button loading={loading} onClick={() => {
                  if (!selectedFamilleId) return;
                  withLoading(() => personneService.joinFamily(personne.id, selectedFamilleId))
                    .then(() => setShowLinkFamille(false));
                }}>Rejoindre</Button>
              </div>
            </div>
          ) : (
            <Button variant="secondary" onClick={() => setShowLinkFamille(true)}>
              <Users size={14} /> Rejoindre une famille
            </Button>
          )}
        </div>
      )}
    </Modal>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function PersonnesPage() {
  const { data: personnes, isLoading, isError } = usePersonnes();
  const createMutation = useCreatePersonne();
  const deleteMutation = useDeletePersonne();

  const [search,       setSearch]       = useState("");
  const [modalOpen,    setModalOpen]    = useState(false);
  const [editing,      setEditing]      = useState<Personne | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Personne | null>(null);
  const [detail,       setDetail]       = useState<Personne | null>(null);

  const updateMutation = useUpdatePersonne(editing?.id ?? "");

  const filtered = (personnes ?? []).filter(p =>
    `${p.prenom} ${p.nom}`.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit   = (p: Personne) => { setEditing(p); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); };

  const handleSubmit = (payload: PersonnePayload) => {
    if (editing) updateMutation.mutate(payload, { onSuccess: closeModal });
    else         createMutation.mutate(payload, { onSuccess: closeModal });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Personnes</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gérez les membres de votre base généalogique</p>
        </div>
        <Button onClick={openCreate}><Plus size={16} /> Ajouter</Button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par prénom ou nom…"
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-blue-400 outline-none" />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-400">Chargement…</div>
        ) : isError ? (
          <div className="p-8 text-center text-sm text-red-500">Erreur lors du chargement.</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">
            {search ? "Aucun résultat." : "Aucune personne enregistrée."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {["Prénom","Nom","Date de naissance","Genre","Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.prenom}</td>
                  <td className="px-4 py-3 text-gray-600">{p.nom}</td>
                  <td className="px-4 py-3 text-gray-600">{p.dateNaissance ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{p.sexe === "M" ? "Homme" : "Femme"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {/* Voir détail / relations */}
                      <button onClick={() => setDetail(p)}
                        className="flex items-center gap-1 px-2 py-1.5 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        Relations <ChevronRight size={13} />
                      </button>
                      <button onClick={() => openEdit(p)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => setDeleteTarget(p)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal CRUD */}
      <Modal open={modalOpen} onClose={closeModal}
        title={editing ? "Modifier la personne" : "Ajouter une personne"}
        subtitle="Renseignez les informations de la personne">
        <PersonneForm initial={editing ?? undefined} onSubmit={handleSubmit} onCancel={closeModal}
          loading={createMutation.isPending || updateMutation.isPending} />
      </Modal>

      {/* Modal détail / relations */}
      {detail && (
        <PersonneDetailModal
          personne={detail}
          onClose={() => setDetail(null)} />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        message={`Supprimer ${deleteTarget?.prenom} ${deleteTarget?.nom} ? Cette action est irréversible.`}
        onConfirm={() => deleteMutation.mutate(deleteTarget!.id, { onSuccess: () => setDeleteTarget(null) })}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteMutation.isPending} />
    </div>
  );
}