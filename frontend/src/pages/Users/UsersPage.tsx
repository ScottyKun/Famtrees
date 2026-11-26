import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { authErrorMessage, fieldErrors } from "../../auth/authErrors";
import { useCreateUser, useDeleteUser, useUpdateUser, useUsers } from "../../hooks/useUsers";
import { usePersonnes } from "../../hooks/usePersonnes";
import Modal from "../../components/ui/Modal";
import { Button, ConfirmDialog, Input, Select } from "../../components/ui/FormElements";
import type { User, UserPayload } from "../../types";

// ── Formulaire création / modification ───────────────────────────────────────
function UserForm({ initial, onSubmit, onCancel, loading, serverError, serverFields }: {
  initial?: User;
  onSubmit: (payload: UserPayload) => void;
  onCancel: () => void;
  loading: boolean;
  serverError: string | null;
  serverFields: Record<string, string>;
}) {
  const { data: personnes } = usePersonnes();
  const [form, setForm] = useState({
    prenom: initial?.prenom ?? "",
    nom: initial?.nom ?? "",
    email: initial?.email ?? "",
    password: "",
    personne_id: initial?.personne_id ?? "",
  });
  const [touched, setTouched] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const editing = !!initial;
  const errors = {
    prenom: !form.prenom.trim() ? "Requis" : undefined,
    nom: !form.nom.trim() ? "Requis" : undefined,
    email: !/^\S+@\S+\.\S+$/.test(form.email) ? "Email invalide" : serverFields.email,
    // En modification, un mot de passe vide = inchangé
    password: (!editing || form.password) && (form.password.length < 8 || form.password.length > 128)
      ? "8 à 128 caractères" : undefined,
  };
  const show = (k: keyof typeof errors) => (touched ? errors[k] : undefined);

  const personneOptions = [
    { value: "", label: "Aucune" },
    ...(personnes ?? [])
      .slice()
      .sort((a, b) => `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`))
      .map(p => ({ value: p.id, label: `${p.prenom} ${p.nom}${p.dateNaissance ? ` (${p.dateNaissance.slice(0, 4)})` : ""}` })),
  ];

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (Object.values(errors).some(Boolean)) return;
    const payload: UserPayload = {
      prenom: form.prenom.trim(),
      nom: form.nom.trim(),
      email: form.email.trim(),
      personne_id: form.personne_id || null,
    };
    if (form.password) payload.password = form.password;
    onSubmit(payload);
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Prénom" required value={form.prenom} onChange={set("prenom")} error={show("prenom")} />
        <Input label="Nom" required value={form.nom} onChange={set("nom")} error={show("nom")} />
      </div>
      <Input label="Email" type="email" required autoComplete="off" value={form.email} onChange={set("email")} error={show("email")} />
      <Input
        label={editing ? "Nouveau mot de passe (laisser vide pour ne pas changer)" : "Mot de passe"}
        type="password" required={!editing} autoComplete="new-password"
        value={form.password} onChange={set("password")} error={show("password")} />
      <Select label="Fiche dans l'arbre (optionnel)" value={form.personne_id} onChange={set("personne_id")} options={personneOptions} />

      {serverError && <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{serverError}</p>}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>Annuler</Button>
        <Button type="submit" loading={loading}>{editing ? "Enregistrer" : "Ajouter"}</Button>
      </div>
    </form>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
// Pas de rôle admin : tout utilisateur connecté peut gérer tous les comptes.
export default function UsersPage() {
  const { user: me, endSession } = useAuth();
  const navigate = useNavigate();
  const { data: users, isLoading, isError } = useUsers();
  const { data: personnes } = usePersonnes();
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();

  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [serverFields, setServerFields] = useState<Record<string, string>>({});

  const filtered = (users ?? []).filter(u =>
    `${u.prenom} ${u.nom} ${u.email}`.toLowerCase().includes(search.toLowerCase()));

  const personneName = (id: string | null) => {
    if (!id) return "—";
    const p = personnes?.find(x => x.id === id);
    return p ? `${p.prenom} ${p.nom}` : "Fiche introuvable";
  };

  const resetErrors = () => { setServerError(null); setServerFields({}); };
  const openCreate = () => { resetErrors(); setEditing(null); setModalOpen(true); };
  const openEdit = (u: User) => { resetErrors(); setEditing(u); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); };
  const onError = (err: unknown) => { setServerError(authErrorMessage(err)); setServerFields(fieldErrors(err)); };

  const handleSubmit = (payload: UserPayload) => {
    resetErrors();
    if (editing) updateMutation.mutate({ id: editing.id, payload }, { onSuccess: closeModal, onError });
    else createMutation.mutate(payload, { onSuccess: closeModal, onError });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: res => {
        setDeleteTarget(null);
        if (res.self) { endSession(); navigate("/login", { replace: true }); }
      },
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Utilisateurs</h1>
          <p className="text-sm text-gray-500 mt-0.5">Comptes qui peuvent se connecter à l'application</p>
        </div>
        <Button onClick={openCreate}><Plus size={16} /> Ajouter</Button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par nom ou email…" aria-label="Rechercher un utilisateur"
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-blue-400 outline-none" />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-400">Chargement…</div>
        ) : isError ? (
          <div className="p-8 text-center text-sm text-red-500">Erreur lors du chargement.</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">{search ? "Aucun résultat." : "Aucun utilisateur."}</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {["Nom", "Email", "Fiche dans l'arbre", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {u.prenom} {u.nom}
                    {u.id === me?.id && <span className="ml-2 text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">Vous</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3 text-gray-600">{personneName(u.personne_id)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(u)} aria-label={`Modifier ${u.prenom} ${u.nom}`}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => setDeleteTarget(u)} aria-label={`Supprimer ${u.prenom} ${u.nom}`}
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

      <Modal open={modalOpen} onClose={closeModal}
        title={editing ? "Modifier l'utilisateur" : "Ajouter un utilisateur"}
        subtitle="Compte de connexion à l'application">
        <UserForm key={editing?.id ?? "new"} initial={editing ?? undefined}
          onSubmit={handleSubmit} onCancel={closeModal}
          loading={createMutation.isPending || updateMutation.isPending}
          serverError={serverError} serverFields={serverFields} />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        message={deleteTarget?.id === me?.id
          ? "Supprimer votre propre compte ? Vous serez déconnecté immédiatement."
          : `Supprimer le compte de ${deleteTarget?.prenom} ${deleteTarget?.nom} ? Cette action est irréversible.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteMutation.isPending} />
    </div>
  );
}
