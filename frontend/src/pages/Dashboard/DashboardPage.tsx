import { Link } from "react-router-dom";
import { Users, Home, Heart, GitBranch, ArrowRight } from "lucide-react";
import { usePersonnes }  from "../../hooks/usePersonnes";
import { useFamilles }   from "../../hooks/useFamilles";
import { useUnions }     from "../../hooks/useUnions";
import { useArbres }     from "../../hooks/useArbres";

interface StatCardProps {
  label: string; sublabel: string; count: number | undefined;
  loading: boolean; icon: React.ReactNode; iconBg: string; to: string;
}

function StatCard({ label, sublabel, count, loading, icon, iconBg, to }: StatCardProps) {
  return (
    <Link to={to} className="bg-white rounded-xl border border-gray-100 p-5 flex items-start justify-between hover:shadow-sm transition-shadow">
      <div>
        <p className="text-sm text-gray-500 mb-3">{label}</p>
        {loading
          ? <div className="h-8 w-16 bg-gray-100 rounded animate-pulse" />
          : <p className="text-3xl font-bold text-gray-900">{count ?? 0}</p>}
        <p className="text-xs text-gray-400 mt-1">{sublabel}</p>
      </div>
      <div className={`p-2.5 rounded-lg ${iconBg}`}>{icon}</div>
    </Link>
  );
}

function QuickStep({ num, title, desc, color }: { num: number; title: string; desc: string; color: string }) {
  return (
    <div className="flex gap-4">
      <div className={`shrink-0 w-7 h-7 rounded-full ${color} flex items-center justify-center text-white text-xs font-bold`}>{num}</div>
      <div>
        <p className="text-sm font-semibold text-gray-800">{title}</p>
        <p className="text-sm text-gray-500 mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: personnes, isLoading: lP } = usePersonnes();
  const { data: familles,  isLoading: lF } = useFamilles();
  const { data: unions,    isLoading: lU } = useUnions();
  const { data: arbres,    isLoading: lA } = useArbres();

  const stats = [
    { label: "Personnes", sublabel: "Membres enregistrés",    count: personnes?.length, loading: lP, icon: <Users size={20} className="text-blue-600" />,   iconBg: "bg-blue-50",   to: "/personnes" },
    { label: "Familles",  sublabel: "Familles recensées",      count: familles?.length,  loading: lF, icon: <Home size={20} className="text-green-600" />,   iconBg: "bg-green-50",  to: "/familles"  },
    { label: "Unions",    sublabel: "Unions enregistrées",     count: unions?.length,    loading: lU, icon: <Heart size={20} className="text-red-500" />,    iconBg: "bg-red-50",    to: "/unions"    },
    { label: "Arbres",    sublabel: "Arbres généalogiques",    count: arbres?.length,    loading: lA, icon: <GitBranch size={20} className="text-purple-600" />, iconBg: "bg-purple-50", to: "/arbres" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-sm text-gray-500 mt-1">Bienvenue dans votre application de gestion généalogique</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => <StatCard key={s.to} {...s} />)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Démarrage rapide</h2>
            <p className="text-sm text-gray-500 mt-0.5">Commencez à construire votre arbre généalogique</p>
          </div>
          <div className="space-y-4">
            <QuickStep num={1} color="bg-blue-500"   title="Ajoutez des personnes"    desc="Enregistrez les membres de votre famille avec leurs informations" />
            <QuickStep num={2} color="bg-green-500"  title="Créez des familles"       desc="Organisez vos membres en familles distinctes" />
            <QuickStep num={3} color="bg-red-500"    title="Enregistrez les unions"   desc="Documentez les mariages et partenariats" />
            <QuickStep num={4} color="bg-purple-500" title="Générez un arbre"         desc="Visualisez votre arbre généalogique complet" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Activité récente</h2>
            <p className="text-sm text-gray-500 mt-0.5">Dernières modifications dans votre base de données</p>
          </div>
          {lP ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}</div>
          ) : (personnes?.length ?? 0) > 0 ? (
            <div className="flex items-start gap-3">
              <div className="mt-1 p-1.5 rounded-md bg-blue-50"><Users size={14} className="text-blue-600" /></div>
              <div>
                <p className="text-sm font-medium text-gray-800">{personnes!.length} personne{personnes!.length > 1 ? "s" : ""} enregistrée{personnes!.length > 1 ? "s" : ""}</p>
                <p className="text-xs text-gray-400">Base de données active</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Votre application est prête. Commencez par ajouter des membres.</p>
          )}
          <Link to="/personnes" className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
            Voir toutes les personnes <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}