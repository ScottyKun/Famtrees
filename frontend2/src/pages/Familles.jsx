import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { famillesAPI } from '../services/api';
import { sanitizeFormData, escapeHtml } from '../utils/security';

// Données mockées
const mockFamilles = [
  { 
    id: '1', 
    nomFamille: 'Dupont', 
    description: 'Famille paternelle',
    nombreMembres: 8,
    dateCreation: '2024-01-15'
  },
  { 
    id: '2', 
    nomFamille: 'Martin', 
    description: 'Famille maternelle',
    nombreMembres: 12,
    dateCreation: '2024-01-20'
  },
  { 
    id: '3', 
    nomFamille: 'Durand-Leblanc', 
    description: 'Branche étendue',
    nombreMembres: 15,
    dateCreation: '2024-02-01'
  },
];

const emptyForm = {
  nomFamille: '',
  description: '',
  lieuOrigine: '',
  notes: '',
};

export function Familles() {
  const [familles, setFamilles] = useState(mockFamilles);
  const [filteredFamilles, setFilteredFamilles] = useState(mockFamilles);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFamille, setEditingFamille] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [useBackend, setUseBackend] = useState(false);

  useEffect(() => {
    if (useBackend) {
      loadFamillesFromBackend();
    }
  }, [useBackend]);

  useEffect(() => {
    filterFamilles();
  }, [searchTerm, familles]);

  const loadFamillesFromBackend = async () => {
    try {
      const data = await famillesAPI.getAll();
      setFamilles(data);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      alert('Erreur de connexion au backend. Utilisation des données mockées.');
      setUseBackend(false);
    }
  };

  const filterFamilles = () => {
    if (!searchTerm) {
      setFilteredFamilles(familles);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = familles.filter(f => 
      f.nomFamille.toLowerCase().includes(term) ||
      (f.description && f.description.toLowerCase().includes(term))
    );
    setFilteredFamilles(filtered);
  };

  const handleOpenDialog = (famille = null) => {
    if (famille) {
      setEditingFamille(famille);
      setFormData({ ...famille });
    } else {
      setEditingFamille(null);
      setFormData(emptyForm);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingFamille(null);
    setFormData(emptyForm);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nomFamille) {
      alert('Le nom de famille est obligatoire');
      return;
    }

    const sanitizedData = sanitizeFormData(formData);

    if (useBackend) {
      try {
        if (editingFamille) {
          const updated = await famillesAPI.update(editingFamille.id, sanitizedData);
          setFamilles(prev => prev.map(f => f.id === editingFamille.id ? updated : f));
        } else {
          const created = await famillesAPI.create(sanitizedData);
          setFamilles(prev => [...prev, created]);
        }
        handleCloseDialog();
      } catch (error) {
        alert('Erreur lors de l\'enregistrement: ' + error.message);
      }
    } else {
      if (editingFamille) {
        setFamilles(prev => prev.map(f => 
          f.id === editingFamille.id ? { ...sanitizedData, id: editingFamille.id, nombreMembres: f.nombreMembres } : f
        ));
      } else {
        const newFamille = {
          ...sanitizedData,
          id: Date.now().toString(),
          nombreMembres: 0,
          dateCreation: new Date().toISOString().split('T')[0],
        };
        setFamilles(prev => [...prev, newFamille]);
      }
      handleCloseDialog();
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette famille ?')) {
      return;
    }

    if (useBackend) {
      try {
        await famillesAPI.delete(id);
        setFamilles(prev => prev.filter(f => f.id !== id));
      } catch (error) {
        alert('Erreur lors de la suppression: ' + error.message);
      }
    } else {
      setFamilles(prev => prev.filter(f => f.id !== id));
    }
  };

  return (
    <div className="p-6">
      <div className="page-header">
        <div className="page-header-content">
          <h1>Familles</h1>
          <p>Gérez les groupes familiaux de votre arbre</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Button
            variant={useBackend ? 'outline' : 'ghost'}
            size="sm"
            onClick={() => setUseBackend(!useBackend)}
          >
            {useBackend ? '🔌 Backend' : '📦 Démo'}
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus size={20} />
            Ajouter une famille
          </Button>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="search-container mb-6">
        <Search className="search-icon" />
        <Input
          type="text"
          placeholder="Rechercher par nom de famille..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Tableau */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Nom de famille</th>
              <th>Description</th>
              <th className="hide-md">Membres</th>
              <th className="hide-lg">Date de création</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredFamilles.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center" style={{ padding: '2rem' }}>
                  {searchTerm ? 'Aucun résultat trouvé' : 'Aucune famille enregistrée'}
                </td>
              </tr>
            ) : (
              filteredFamilles.map((famille) => (
                <tr key={famille.id}>
                  <td style={{ fontWeight: '500' }}>
                    {escapeHtml(famille.nomFamille)}
                  </td>
                  <td>{famille.description || '-'}</td>
                  <td className="hide-md">
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.375rem',
                      backgroundColor: '#eff6ff',
                      color: '#1d4ed8',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}>
                      {famille.nombreMembres} personne{famille.nombreMembres > 1 ? 's' : ''}
                    </span>
                  </td>
                  <td className="hide-lg" style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                    {famille.dateCreation || '-'}
                  </td>
                  <td>
                    <div className="actions">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(famille)}
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(famille.id)}
                      >
                        <Trash2 size={16} style={{ color: '#dc2626' }} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Dialog de formulaire */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent style={{ maxWidth: '600px', width: '100%' }}>
          <DialogHeader>
            <DialogTitle>
              {editingFamille ? 'Modifier la famille' : 'Ajouter une famille'}
            </DialogTitle>
          </DialogHeader>
          <DialogBody>
            <form onSubmit={handleSubmit} id="famille-form">
              <div className="form-group">
                <Label htmlFor="nomFamille">Nom de famille *</Label>
                <Input
                  id="nomFamille"
                  name="nomFamille"
                  value={formData.nomFamille}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Ex: Famille paternelle, branche maternelle..."
                />
              </div>

              <div className="form-group">
                <Label htmlFor="lieuOrigine">Lieu d'origine</Label>
                <Input
                  id="lieuOrigine"
                  name="lieuOrigine"
                  value={formData.lieuOrigine}
                  onChange={handleChange}
                  placeholder="Ex: Paris, Lyon, Marseille..."
                />
              </div>

              <div className="form-group">
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  name="notes"
                  className="textarea"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Informations supplémentaires..."
                />
              </div>
            </form>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Annuler
            </Button>
            <Button type="submit" form="famille-form">
              {editingFamille ? 'Modifier' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
