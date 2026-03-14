import React from "react";
import { Link } from "react-router";
import { Users, GitBranch, Heart, Network } from "lucide-react";

export function Home() {
  const statsCards = [
    {
      title: "Personnes",
      value: 0,
      icon: Users,
      link: "/personnes",
      description: "Membres enregistrés",
      color: "bg-blue-500",
    },
    {
      title: "Familles",
      value: 0,
      icon: GitBranch,
      link: "/familles",
      description: "Groupes familiaux",
      color: "bg-green-500",
    },
    {
      title: "Unions",
      value: 0,
      icon: Heart,
      link: "/unions",
      description: "Mariages",
      color: "bg-red-500",
    },
    {
      title: "Arbres",
      value: 0,
      icon: Network,
      link: "/arbres",
      description: "Arbres généalogiques",
      color: "bg-purple-500",
    },
  ];

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">
          Tableau de bord
        </h1>
        <p className="text-gray-500">
          Vue d'ensemble de votre application
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat) => {
          const Icon = stat.icon;

          return (
            <Link
              key={stat.title}
              to={stat.link}
              className="bg-white rounded-2xl shadow-sm hover:shadow-md transition p-6 flex flex-col justify-between"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-gray-500 text-sm">
                    {stat.title}
                  </h3>
                  <p className="text-2xl font-bold text-gray-800 mt-1">
                    {stat.value}
                  </p>
                </div>

                <div className={`p-3 rounded-xl text-white ${stat.color}`}>
                  <Icon size={22} />
                </div>
              </div>

              <p className="text-xs text-gray-400 mt-4">
                {stat.description}
              </p>
            </Link>
          );
        })}
      </div>

      {/* Empty State Section */}
      <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
        <h2 className="text-xl font-semibold text-gray-700">
          Bienvenue 👋
        </h2>
        <p className="text-gray-500 mt-2">
          Commencez par ajouter des personnes ou créer un arbre généalogique.
        </p>
      </div>
    </div>
  );
}