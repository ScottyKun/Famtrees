// Cadre commun des pages Connexion / Inscription (hors du Layout de l'appli).
export default function AuthCard({ title, subtitle, children }: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="text-xl font-bold text-gray-900 tracking-tight">Généalogie</span>
          <p className="text-xs text-gray-500 mt-0.5">Gestion familiale</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 sm:p-8">
          <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500 mt-1 mb-6">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
