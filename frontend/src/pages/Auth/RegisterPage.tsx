import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { authErrorMessage, fieldErrors } from "../../auth/authErrors";
import { Button, Input } from "../../components/ui/FormElements";
import AuthCard from "./AuthCard";

// Le compte est indépendant des Personne de l'arbre : on pourra le relier à
// "sa" fiche plus tard depuis la page Utilisateurs.
export default function RegisterPage() {
  const { status, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";

  const [form, setForm] = useState({ prenom: "", nom: "", email: "", password: "", confirm: "" });
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverFields, setServerFields] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  if (status === "authenticated") return <Navigate to={from} replace />;

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const errors = {
    prenom: !form.prenom.trim() ? "Requis" : undefined,
    nom: !form.nom.trim() ? "Requis" : undefined,
    email: !/^\S+@\S+\.\S+$/.test(form.email) ? "Email invalide" : serverFields.email,
    password: form.password.length < 8 ? "8 caractères minimum" : form.password.length > 128 ? "128 caractères maximum" : undefined,
    confirm: form.confirm !== form.password ? "Les mots de passe ne correspondent pas" : undefined,
  };
  const valid = Object.values(errors).every(e => !e);
  const show = (k: keyof typeof errors) => (touched ? errors[k] : undefined);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    setServerFields({});
    if (!valid) return;
    setError(null);
    setSubmitting(true);
    try {
      await register({ email: form.email.trim(), password: form.password, prenom: form.prenom.trim(), nom: form.nom.trim() });
      navigate(from, { replace: true });
    } catch (err) {
      setServerFields(fieldErrors(err));
      setError(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard title="Créer un compte" subtitle="Accédez à l'arbre généalogique de la famille.">
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Prénom" required autoComplete="given-name" value={form.prenom} onChange={set("prenom")} error={show("prenom")} />
          <Input label="Nom" required autoComplete="family-name" value={form.nom} onChange={set("nom")} error={show("nom")} />
        </div>
        <Input label="Email" type="email" required autoComplete="email" value={form.email} onChange={set("email")} error={show("email")} />
        <Input label="Mot de passe" type="password" required autoComplete="new-password" value={form.password} onChange={set("password")} error={show("password")} />
        <Input label="Confirmer le mot de passe" type="password" required autoComplete="new-password" value={form.confirm} onChange={set("confirm")} error={show("confirm")} />

        {error && <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <Button type="submit" loading={submitting} className="w-full">Créer mon compte</Button>
      </form>
      <p className="text-sm text-gray-600 mt-6 text-center">
        Déjà inscrit ?{" "}
        <Link to="/login" state={location.state} className="text-blue-600 hover:text-blue-800 font-medium">
          Se connecter
        </Link>
      </p>
    </AuthCard>
  );
}
