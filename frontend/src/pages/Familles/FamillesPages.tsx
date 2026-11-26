import { useState } from "react";
import { Plus, Pencil, Trash2, Search, ChevronRight, X, UserPlus } from "lucide-react";
import { useFamilles, useCreateFamille, useUpdateFamille, useDeleteFamille } from "../../hooks/useFamilles";
import { usePersonnes } from "../../hooks/usePersonnes";
import { familleService } from "../../services/familleService";
import { useQueryClient } from "@tanstack/react-query";
import { FAMILLES_KEY } from "../../hooks/useFamilles";
import type { Famille, FamillePayload } from "../../types";
import Modal from "../../components/ui/Modal";
import { Input, Button, ConfirmDialog } from "../../components/ui/FormElements";

function FamilleForm({ initial, onSubmit, onCancel, loading }: {
  initial?: Famille; onSubmit: (d: FamillePayload) => void;
  onCancel: () => void; loading: boolean;
}) {
  const [nom, setNom] = useState(initial?.nom ?? "");
  const [error, setError] = useState("");
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) { setError("Le nom est requis"); return; }
    onSubmit({ nom });
  };
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Nom de la famille" required value={nom}
        onChange={e => { setNom(e.target.value); setError(""); }}
        error={error} placeholder="Dupont" />
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>Annuler</Button>
        <Button type="submit" loading={loading}>{initial ? "Enregistrer" : "Créer"}</Button>
      </div>
    </form>
  );
}

function FamilleDetailModal({ famille, onClose }: { famille: Famille; onClose: () => void }) {
  const [loading, setLoading]   = useState(false);
  const [showAdd, setShowAdd]   = useState(false);
  const [selectedId, setSelectedId] = useState("");

  const qc = useQueryClient();
  const { data: personnes } = usePersonnes();

  const refresh = () => qc.invalidateQueries({ queryKey: FAMILLES_KEY });

  const membres = (famille.membresIds ?? []).map(id => {
    const p = personnes?.find(x => x.id === id);
    return { id, label: p ? `${p.prenom} ${p.nom}` : id, sublabel: p?.sexe === "M" ? "Homme" : "Femme" };
  });

  const withLoading = async (fn: () => Promise<unknown>) => {
    setLoading(true);
    try { await fn(); await refresh(); } finally { setLoading(false); }
  };

  return (
    <Modal open onClose={onClose} title={famille.nom} subtitle="Gestion des membres">
      <div className="space-y-3">
        {membres.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">Aucun membre enregistré</p>
        ) : (
          <div className="space-y-2">
            {membres.map(m => (
              <div key={m.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium text-gray-800">{m.label}</p>
                  <p className="text-xs text-gray-400">{m.sublabel}</p>
                </div>
                <button onClick={() => withLoading(() => familleService.removeMember(famille.id, m.id))}
                  disabled={loading}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {showAdd ? (
          <div className="border border-gray-100 rounded-xl p-4 space-y-3">
            <p className="text-sm font-medium text-gray-700">Ajouter un membre</p>
            <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 outline-none">
              <option value="">— Sélectionner une personne —</option>
              {(personnes ?? []).filter(p => !famille.membresIds?.includes(p.id)).map(p => (
                <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setShowAdd(false)} disabled={loading}>Annuler</Button>
              <Button loading={loading} onClick={() => {
                if (!selectedId) return;
                withLoading(() => familleService.linkMember(famille.id, selectedId))
                  .then(() => { setShowAdd(false); setSelectedId(""); });
              }}>Ajouter</Button>
            </div>
          </div>
        ) : (
          <Button variant="secondary" onClick={() => setShowAdd(true)}>
            <UserPlus size={14} /> Ajouter un membre
          </Button>
        )}
      </div>
    </Modal>
  );
}

export default function FamillesPage() {
  const { data: familles,  isLoading, isError } = useFamilles();
  const { data: personnes } = usePersonnes();
  const createMutation = useCreateFamille();
  const deleteMutation = useDeleteFamille();

  const [search,       setSearch]       = useState("");
  const [modalOpen,    setModalOpen]    = useState(false);
  const [editing,      setEditing]      = useState<Famille | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Famille | null>(null);
  const [detail,       setDetail]       = useState<Famille | null>(null);

  const updateMutation = useUpdateFamille(editing?.id ?? "");

  const getMembresNoms = (ids: string[]) =>
    ids.map(id => {
      const p = personnes?.find(p => p.id === id);
      return p ? `${p.prenom} ${p.nom}` : id;
    });

  const filtered = (familles ?? []).filter(f =>
    f.nom.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit   = (f: Famille) => { setEditing(f); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); };

  const handleSubmit = (payload: FamillePayload) => {
    if (editing) updateMutation.mutate(payload, { onSuccess: closeModal });
    else         createMutation.mutate(payload, { onSuccess: closeModal });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Familles</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gérez les familles de votre base généalogique</p>
        </div>
        <Button onClick={openCreate}><Plus size={16} /> Créer</Button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par nom…"
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-blue-400 outline-none" />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-400">Chargement…</div>
        ) : isError ? (
          <div className="p-8 text-center text-sm text-red-500">Erreur lors du chargement.</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">
            {search ? "Aucun résultat." : "Aucune famille enregistrée."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {["Nom","Membres","Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(f => (
                <tr key={f.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{f.nom}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {f.membresIds.length > 0
                      ? getMembresNoms(f.membresIds).join(", ")
                      : <span className="text-gray-400 italic">Aucun membre</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setDetail(f)}
                        className="flex items-center gap-1 px-2 py-1.5 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        Membres <ChevronRight size={13} />
                      </button>
                      <button onClick={() => openEdit(f)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Pencil size={15} /></button>
                      <button onClick={() => setDeleteTarget(f)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modalOpen} onClose={closeModal}
        title={editing ? "Modifier la famille" : "Créer une famille"}
        subtitle="Renseignez le nom de la famille">
        <FamilleForm initial={editing ?? undefined} onSubmit={handleSubmit} onCancel={closeModal}
          loading={createMutation.isPending || updateMutation.isPending} />
      </Modal>

      {detail && <FamilleDetailModal famille={detail} onClose={() => setDetail(null)} />}

      <ConfirmDialog
        open={!!deleteTarget}
        message={`Supprimer la famille "${deleteTarget?.nom}" ? Cette action est irréversible.`}
        onConfirm={() => deleteMutation.mutate(deleteTarget!.id, { onSuccess: () => setDeleteTarget(null) })}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteMutation.isPending} />
    </div>
  );
}