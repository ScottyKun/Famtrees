import { useState } from "react";
import { Plus, Pencil, Trash2, Search, ChevronRight, X, Link2, UserPlus } from "lucide-react";
import { useUnions, useCreateUnion, useUpdateUnion, useDeleteUnion } from "../../hooks/useUnions";
import { usePersonnes } from "../../hooks/usePersonnes";
import { useFamilles }  from "../../hooks/useFamilles";
import { unionService } from "../../services/unionService";
import { useQueryClient } from "@tanstack/react-query";
import { UNIONS_KEY } from "../../hooks/useUnions";
import type { Union, UnionPayload } from "../../types";
import Modal from "../../components/ui/Modal";
import { Input, Select, Button, ConfirmDialog } from "../../components/ui/FormElements";

const TYPE_OPTIONS = [
  { value: "MARIAGE",     label: "Mariage"     },
  { value: "UNION_LIBRE", label: "Union libre" },
  { value: "RELIGIEUX",   label: "Religieux"   },
];

function UnionForm({ initial, onSubmit, onCancel, loading }: {
  initial?: Union; onSubmit: (d: UnionPayload) => void;
  onCancel: () => void; loading: boolean;
}) {
  const [form, setForm] = useState<UnionPayload>({
    type: initial?.type ?? "MARIAGE", libelle: initial?.libelle ?? "",
    dateDebut: initial?.dateDebut ?? null, dateFin: initial?.dateFin ?? null,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof UnionPayload, string>>>({});
  const set = (k: keyof UnionPayload, v: string) => setForm(f => ({ ...f, [k]: v || null }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const err: typeof errors = {};
    if (!form.libelle.trim()) err.libelle = "Requis";
    setErrors(err);
    if (!Object.keys(err).length) onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Libellé" required value={form.libelle}
        onChange={e => set("libelle", e.target.value)} error={errors.libelle} placeholder="Dupont-Martin" />
      <Select label="Type" required value={form.type}
        onChange={e => set("type", e.target.value)} options={TYPE_OPTIONS} />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Date de début" type="date" value={form.dateDebut ?? ""} onChange={e => set("dateDebut", e.target.value)} />
        <Input label="Date de fin"   type="date" value={form.dateFin   ?? ""} onChange={e => set("dateFin",   e.target.value)} />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>Annuler</Button>
        <Button type="submit" loading={loading}>{initial ? "Enregistrer" : "Créer"}</Button>
      </div>
    </form>
  );
}

function UnionDetailModal({ union, onClose }: { union: Union; onClose: () => void }) {
  const [tab, setTab]             = useState("Conjoints");
  const [loading, setLoading]     = useState(false);
  const [showAdd, setShowAdd]     = useState(false);
  const [selectedId, setSelectedId] = useState("");

  const qc = useQueryClient();
  const { data: personnes } = usePersonnes();
  const { data: familles }  = useFamilles();

  const refresh = () => qc.invalidateQueries({ queryKey: UNIONS_KEY });

  const withLoading = async (fn: () => Promise<unknown>) => {
    setLoading(true);
    try { await fn(); await refresh(); } finally { setLoading(false); }
  };

  const pName = (id: string) => {
    const p = personnes?.find(x => x.id === id);
    return p ? `${p.prenom} ${p.nom}` : id;
  };

  const conjoints = (union.conjointsIds ?? []).map(id => ({ id, label: pName(id) }));
  const enfants   = (union.enfantsIds   ?? []).map(id => ({ id, label: pName(id) }));
  const famille   = familles?.find(f => f.id === union.familleId);

  return (
    <Modal open onClose={onClose} title={union.libelle} subtitle={`Union — ${TYPE_OPTIONS.find(t => t.value === union.type)?.label}`}>
      {/* Tabs */}
      <div className="flex border-b border-gray-100 mb-4">
        {["Conjoints", "Enfants", "Famille"].map(t => (
          <button key={t} onClick={() => { setTab(t); setShowAdd(false); setSelectedId(""); }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}>{t}</button>
        ))}
      </div>

      {/* Conjoints */}
      {tab === "Conjoints" && (
        <div className="space-y-3">
          {conjoints.length === 0
            ? <p className="text-sm text-gray-400 py-4 text-center">Aucun conjoint</p>
            : <div className="space-y-2">
                {conjoints.map(c => (
                  <div key={c.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2.5">
                    <p className="text-sm font-medium text-gray-800">{c.label}</p>
                    <button onClick={() => withLoading(() => unionService.removeConjoint(union.id, c.id))}
                      disabled={loading} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
          }
          {showAdd ? (
            <div className="border border-gray-100 rounded-xl p-4 space-y-3">
              <p className="text-sm font-medium text-gray-700">Ajouter un conjoint</p>
              <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 outline-none">
                <option value="">— Sélectionner une personne —</option>
                {(personnes ?? []).filter(p => !union.conjointsIds?.includes(p.id)).map(p => (
                  <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setShowAdd(false)} disabled={loading}>Annuler</Button>
                <Button loading={loading} onClick={() => {
                  if (!selectedId) return;
                  withLoading(() => unionService.addConjoint(union.id, selectedId))
                    .then(() => { setShowAdd(false); setSelectedId(""); });
                }}>Ajouter</Button>
              </div>
            </div>
          ) : (
            <Button variant="secondary" onClick={() => setShowAdd(true)}><UserPlus size={14} /> Ajouter un conjoint</Button>
          )}
        </div>
      )}

      {/* Enfants */}
      {tab === "Enfants" && (
        <div className="space-y-3">
          {enfants.length === 0
            ? <p className="text-sm text-gray-400 py-4 text-center">Aucun enfant</p>
            : <div className="space-y-2">
                {enfants.map(e => (
                  <div key={e.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2.5">
                    <p className="text-sm font-medium text-gray-800">{e.label}</p>
                    <button onClick={() => withLoading(() => unionService.removeEnfant(union.id, e.id))}
                      disabled={loading} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
          }
          {showAdd ? (
            <div className="border border-gray-100 rounded-xl p-4 space-y-3">
              <p className="text-sm font-medium text-gray-700">Ajouter un enfant</p>
              <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 outline-none">
                <option value="">— Sélectionner une personne —</option>
                {(personnes ?? []).filter(p => !union.enfantsIds?.includes(p.id)).map(p => (
                  <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setShowAdd(false)} disabled={loading}>Annuler</Button>
                <Button loading={loading} onClick={() => {
                  if (!selectedId) return;
                  withLoading(() => unionService.addEnfant(union.id, selectedId))
                    .then(() => { setShowAdd(false); setSelectedId(""); });
                }}>Ajouter</Button>
              </div>
            </div>
          ) : (
            <Button variant="secondary" onClick={() => setShowAdd(true)}><UserPlus size={14} /> Ajouter un enfant</Button>
          )}
        </div>
      )}

      {/* Famille */}
      {tab === "Famille" && (
        <div className="space-y-3">
          {famille ? (
            <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2.5">
              <p className="text-sm font-medium text-gray-800">{famille.nom}</p>
              <button onClick={() => withLoading(() => unionService.unlinkFamily(union.id))}
                disabled={loading} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50">
                <X size={14} />
              </button>
            </div>
          ) : (
            <p className="text-sm text-gray-400 py-4 text-center">Aucune famille liée</p>
          )}

          {!famille && (showAdd ? (
            <div className="border border-gray-100 rounded-xl p-4 space-y-3">
              <p className="text-sm font-medium text-gray-700">Lier à une famille</p>
              <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 outline-none">
                <option value="">— Sélectionner une famille —</option>
                {(familles ?? []).map(f => (
                  <option key={f.id} value={f.id}>{f.nom}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => setShowAdd(false)} disabled={loading}>Annuler</Button>
                <Button loading={loading} onClick={() => {
                  if (!selectedId) return;
                  withLoading(() => unionService.linkFamily(union.id, selectedId))
                    .then(() => { setShowAdd(false); setSelectedId(""); });
                }}>Lier</Button>
              </div>
            </div>
          ) : (
            <Button variant="secondary" onClick={() => setShowAdd(true)}><Link2 size={14} /> Lier à une famille</Button>
          ))}
        </div>
      )}
    </Modal>
  );
}

export default function UnionsPage() {
  const { data: unions, isLoading, isError } = useUnions();
  const { data: personnes } = usePersonnes();
  const createMutation = useCreateUnion();
  const deleteMutation = useDeleteUnion();

  const [search,       setSearch]       = useState("");
  const [modalOpen,    setModalOpen]    = useState(false);
  const [editing,      setEditing]      = useState<Union | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Union | null>(null);
  const [detail,       setDetail]       = useState<Union | null>(null);

  const updateMutation = useUpdateUnion(editing?.id ?? "");

  const pName = (id: string) => {
    const p = personnes?.find(x => x.id === id);
    return p ? `${p.prenom} ${p.nom}` : id;
  };

  const filtered = (unions ?? []).filter(u =>
    u.libelle.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit   = (u: Union) => { setEditing(u); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); };

  const handleSubmit = (payload: UnionPayload) => {
    if (editing) updateMutation.mutate(payload, { onSuccess: closeModal });
    else         createMutation.mutate(payload, { onSuccess: closeModal });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Unions</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gérez les unions de votre base généalogique</p>
        </div>
        <Button onClick={openCreate}><Plus size={16} /> Créer</Button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par libellé…"
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-blue-400 outline-none" />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-400">Chargement…</div>
        ) : isError ? (
          <div className="p-8 text-center text-sm text-red-500">Erreur lors du chargement.</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">
            {search ? "Aucun résultat." : "Aucune union enregistrée."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {["Libellé","Type","Conjoints","Période","Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{u.libelle}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-pink-50 text-pink-700">
                      {TYPE_OPTIONS.find(t => t.value === u.type)?.label ?? u.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {u.conjointsIds?.length > 0
                      ? u.conjointsIds.map(id => pName(id)).join(" & ")
                      : <span className="text-gray-400 italic">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {u.dateDebut ?? "—"}{u.dateFin ? ` → ${u.dateFin}` : ""}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setDetail(u)}
                        className="flex items-center gap-1 px-2 py-1.5 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        Relations <ChevronRight size={13} />
                      </button>
                      <button onClick={() => openEdit(u)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Pencil size={15} /></button>
                      <button onClick={() => setDeleteTarget(u)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modalOpen} onClose={closeModal}
        title={editing ? "Modifier l'union" : "Créer une union"}
        subtitle="Renseignez les informations de l'union">
        <UnionForm initial={editing ?? undefined} onSubmit={handleSubmit} onCancel={closeModal}
          loading={createMutation.isPending || updateMutation.isPending} />
      </Modal>

      {detail && <UnionDetailModal union={detail} onClose={() => setDetail(null)} />}

      <ConfirmDialog
        open={!!deleteTarget}
        message={`Supprimer l'union "${deleteTarget?.libelle}" ? Cette action est irréversible.`}
        onConfirm={() => deleteMutation.mutate(deleteTarget!.id, { onSuccess: () => setDeleteTarget(null) })}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteMutation.isPending} />
    </div>
  );
}