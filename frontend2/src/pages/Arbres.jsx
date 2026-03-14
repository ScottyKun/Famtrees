import React, { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";

export function Arbres() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Arbres généalogiques
          </h1>
          <p className="text-gray-500">
            Gérez vos arbres
          </p>
        </div>

        <button
          onClick={() => setDialogOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl transition"
        >
          <Plus size={18} />
          Créer un arbre
        </button>
      </div>

      {/* Empty State */}
      <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
        <h2 className="text-lg font-semibold text-gray-700">
          Aucun arbre pour le moment
        </h2>
        <p className="text-gray-500 mt-2">
          Cliquez sur "Créer un arbre" pour commencer.
        </p>
      </div>

      {/* Modal */}
      {dialogOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-bold">
              Créer un arbre généalogique
            </h2>

            <input
              type="text"
              placeholder="Titre"
              className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <textarea
              placeholder="Description"
              className="w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDialogOpen(false)}
                className="px-4 py-2 rounded-xl border"
              >
                Annuler
              </button>
              <button className="px-4 py-2 rounded-xl bg-indigo-600 text-white">
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}