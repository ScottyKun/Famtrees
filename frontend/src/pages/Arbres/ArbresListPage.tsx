import { useState } from "react";
import { Plus, GitBranch, Pencil, Trash2, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { useArbres, useCreateArbre, useUpdateArbre, useDeleteArbre } from "../../hooks/useArbres";
import { usePersonnes } from "../../hooks/usePersonnes";
import type { Arbre, ArbrePayload } from "../../types";
import Modal from "../../components/ui/Modal";
import { Input, Button, ConfirmDialog } from "../../components/ui/FormElements";

interface ArbreFormProps {
  initial?: Arbre;
  onSubmit: (data: ArbrePayload) => void;
  onCancel: () => void;
  loading:  boolean;
}

function ArbreForm({ initial, onSubmit, onCancel, loading }: ArbreFormProps) {
  const { data: personnes } = usePersonnes();
  const [nom,      setNom]      = useState(initial?.nom       ?? "");
  const [racineId, setRacineId] = useState(initial?.racine_id ?? "");
  const [depth,    setDepth]    = useState(initial?.depth     ?? 3);
  const [errors,   setErrors]   = useState<{ nom?: string; racineId?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!nom.trim())     e.nom      = "Le nom est requis";
    if (!racineId.trim()) e.racineId = "La personne racine est requise";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSubmit({ nom, racine_id: racineId, depth });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input label="Nom de l'arbre" required value={nom}
        onChange={e => { setNom(e.target.value); setErrors(v => ({ ...v, nom: undefined })); }}
        error={errors.nom} placeholder="Arbre Dupont" />

      {/* Sélecteur de racine */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
          Personne racine <span className="text-red-500">*</span>
        </label>
        <select value={racineId} onChange={e => setRacineId(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-blue-400 outline-none">
          <option value="">— Sélectionner une personne —</option>
          {(personnes ?? []).map(p => (
            <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>
          ))}
        </select>
        {errors.racineId && <p className="text-xs text-red-500">{errors.racineId}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Profondeur par défaut</label>
        <div className="flex items-center gap-3">
          <input type="range" min={1} max={6} value={depth}
            onChange={e => setDepth(Number(e.target.value))}
            className="flex-1 accent-blue-600" />
          <span className="text-sm font-semibold text-gray-700 w-4">{depth}</span>
        </div>
        <p className="text-xs text-gray-400">Nombre de générations affichées</p>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>Annuler</Button>
        <Button type="submit" loading={loading}>{initial ? "Enregistrer" : "Créer"}</Button>
      </div>
    </form>
  );
}

export default function ArbresListPage() {
  const { data: arbres,    isLoading, isError } = useArbres();
  const { data: personnes } = usePersonnes();
  const createMutation = useCreateArbre();
  const deleteMutation = useDeleteArbre();

  const [modalOpen,    setModalOpen]    = useState(false);
  const [editing,      setEditing]      = useState<Arbre | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Arbre | null>(null);

  const updateMutation = useUpdateArbre(editing?.id ?? "");

  const getRacineName = (racineId: string) => {
    const p = personnes?.find(p => p.id === racineId);
    return p ? `${p.prenom} ${p.nom}` : racineId;
  };

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit   = (a: Arbre) => { setEditing(a); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); };

  const handleSubmit = (payload: ArbrePayload) => {
    if (editing) {
      updateMutation.mutate(payload, { onSuccess: closeModal });
    } else {
      createMutation.mutate(payload, { onSuccess: closeModal });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Arbres</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gérez vos arbres généalogiques</p>
        </div>
        <Button onClick={openCreate}><Plus size={16} /> Créer un arbre</Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-36 bg-white rounded-xl border border-gray-100 animate-pulse" />)}
        </div>
      ) : isError ? (
        <div className="p-8 text-center text-sm text-red-500">Erreur lors du chargement.</div>
      ) : (arbres ?? []).length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center space-y-3">
          <GitBranch size={32} className="mx-auto text-gray-300" />
          <p className="text-sm font-medium text-gray-700">Aucun arbre pour le moment</p>
          <p className="text-sm text-gray-400">Cliquez sur "Créer un arbre" pour commencer.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(arbres ?? []).map(a => (
            <div key={a.id} className="bg-white rounded-xl border border-gray-100 p-5 space-y-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div className="p-2 rounded-lg bg-purple-50">
                  <GitBranch size={18} className="text-purple-600" />
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(a)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Pencil size={14} /></button>
                  <button onClick={() => setDeleteTarget(a)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{a.nom}</p>
                <p className="text-xs text-gray-500 mt-0.5">Racine : {getRacineName(a.racine_id)}</p>
                <p className="text-xs text-gray-400 mt-0.5">Profondeur : {a.depth} génération{a.depth > 1 ? "s" : ""}</p>
              </div>
              <Link to={`/arbres/${a.id}`}
                className="flex items-center justify-center gap-2 w-full py-2 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
                <Eye size={15} /> Visualiser
              </Link>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={closeModal}
        title={editing ? "Modifier l'arbre" : "Créer un arbre"}
        subtitle="Configurez votre arbre généalogique">
        <ArbreForm initial={editing ?? undefined} onSubmit={handleSubmit} onCancel={closeModal}
          loading={createMutation.isPending || updateMutation.isPending} />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        message={`Supprimer l'arbre "${deleteTarget?.nom}" ? Cette action est irréversible.`}
        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)}
        loading={deleteMutation.isPending} />
    </div>
  );
}