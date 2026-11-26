import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { authErrorMessage } from "../../auth/authErrors";
import { Button, Input } from "../../components/ui/FormElements";
import AuthCard from "./AuthCard";

export default function LoginPage() {
  const { status, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (status === "authenticated") return <Navigate to={from} replace />;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthCard title="Connexion" subtitle="Accédez à votre arbre généalogique.">
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <Input label="Email" type="email" autoComplete="email" required
          value={email} onChange={e => setEmail(e.target.value)} />
        <Input label="Mot de passe" type="password" autoComplete="current-password" required
          value={password} onChange={e => setPassword(e.target.value)} />

        {error && <p role="alert" className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <Button type="submit" loading={submitting} disabled={!email || !password} className="w-full">
          Se connecter
        </Button>
      </form>
      <p className="text-sm text-gray-600 mt-6 text-center">
        Pas encore de compte ?{" "}
        <Link to="/register" state={location.state} className="text-blue-600 hover:text-blue-800 font-medium">
          Créer un compte
        </Link>
      </p>
    </AuthCard>
  );
}
