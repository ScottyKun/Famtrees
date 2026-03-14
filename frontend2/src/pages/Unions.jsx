import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search, Heart } from 'lucide-react';
import { unionsAPI } from '../services/api';
import { sanitizeFormData, escapeHtml } from '../utils/security';

// Données mockées
const mockUnions = [
  { 
    id: '1',
    conjoint1: 'Jean Dupont',
    conjoint2: 'Marie Martin',
    typeUnion: 'Mariage',
    dateUnion: '2005-06-15',
    lieuUnion: 'Paris',
    dateFin: null,
    typeFinUnion: null,
  },
  { 
    id: '2',
    conjoint1: 'Pierre Durand',
    conjoint2: 'Sophie Bernard',
    typeUnion: 'PACS',
    dateUnion: '2010-09-20',
    lieuUnion: 'Lyon',
    dateFin: null,
    typeFinUnion: null,
  },
  { 
    id: '3',
    conjoint1: 'Marc Petit',
    conjoint2: 'Julie Moreau',
    typeUnion: 'Mariage',
    dateUnion: '1998-04-12',
    lieuUnion: 'Marseille',
    dateFin: '2015-11-30',
    typeFinUnion: 'Divorce',
  },
];

const emptyForm = {
  conjoint1Id: '',
  conjoint2Id: '',
  typeUnion: '',
  dateUnion: '',
  lieuUnion: '',
  dateFin: '',
  typeFinUnion: '',
  notes: '',
};

export function Unions() {
  const [unions, setUnions] = useState(mockUnions);
  const [filteredUnions, setFilteredUnions] = useState(mockUnions);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUnion, setEditingUnion] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [useBackend, setUseBackend] = useState(false);

  useEffect(() => {
    if (useBackend) {
      loadUnionsFromBackend();
    }
  }, [useBackend]);

  useEffect(() => {
    filterUnions();
  }, [searchTerm, unions]);

  const loadUnionsFromBackend = async () => {
    try {
      const data = await unionsAPI.getAll();
      setUnions(data);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      alert('Erreur de connexion au backend. Utilisation des données mockées.');
      setUseBackend(false);
    }
  };

  const filterUnions = () => {
    if (!searchTerm) {
      setFilteredUnions(unions);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = unions.filter(u => 
      u.conjoint1.toLowerCase().includes(term) ||
      u.conjoint2.toLowerCase().includes(term) ||
      (u.lieuUnion && u.lieuUnion.toLowerCase().includes(term))
    );
    setFilteredUnions(filtered);
  };

  const handleOpenDialog = (union = null) => {
    if (union) {
      setEditingUnion(union);
      setFormData({ ...union });
    } else {
      setEditingUnion(null);
      setFormData(emptyForm);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingUnion(null);
    setFormData(emptyForm);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.typeUnion || !formData.dateUnion) {
      alert('Le type d\'union et la date sont obligatoires');
      return;
    }

    const sanitizedData = sanitizeFormData(formData);

    if (useBackend) {
      try {
        if (editingUnion) {
          const updated = await unionsAPI.update(editingUnion.id, sanitizedData);
          setUnions(prev => prev.map(u => u.id === editingUnion.id ? updated : u));
        } else {
          const created = await unionsAPI.create(sanitizedData);
          setUnions(prev => [...prev, created]);
        }
        handleCloseDialog();
      } catch (error) {
        alert('Erreur lors de l\'enregistrement: ' + error.message);
      }
    } else {
      if (editingUnion) {
        setUnions(prev => prev.map(u => 
          u.id === editingUnion.id ? { ...sanitizedData, id: editingUnion.id } : u
        ));
      } else {
        const newUnion = {
          ...sanitizedData,
          id: Date.now().toString(),
          conjoint1: 'Personne 1', // En mode mock, on affiche des noms génériques
          conjoint2: 'Personne 2',
        };
        setUnions(prev => [...prev, newUnion]);
      }
      handleCloseDialog();
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette union ?')) {
      return;
    }

    if (useBackend) {
      try {
        await unionsAPI.delete(id);
        setUnions(prev => prev.filter(u => u.id !== id));
      } catch (error) {
        alert('Erreur lors de la suppression: ' + error.message);
      }
    } else {
      setUnions(prev => prev.filter(u => u.id !== id));
    }
  };

  return (
    <div className="p-6">
      <div className="page-header">
        <div className="page-header-content">
          <h1>Unions</h1>
          <p>Gérez les mariages et partenariats</p>
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
            Ajouter une union
          </Button>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="search-container mb-6">
        <Search className="search-icon" />
        <Input
          type="text"
          placeholder="Rechercher par nom de conjoint..."
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
              <th>Conjoints</th>
              <th>Type</th>
              <th className="hide-md">Date</th>
              <th className="hide-lg">Lieu</th>
              <th className="hide-md">Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUnions.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center" style={{ padding: '2rem' }}>
                  {searchTerm ? 'Aucun résultat trouvé' : 'Aucune union enregistrée'}
                </td>
              </tr>
            ) : (
              filteredUnions.map((union) => (
                <tr key={union.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Heart size={16} style={{ color: '#dc2626', flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: '500', fontSize: '0.875rem' }}>
                          {escapeHtml(union.conjoint1)}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          {escapeHtml(union.conjoint2)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.375rem',
                      backgroundColor: union.typeUnion === 'Mariage' ? '#fee2e2' : '#dbeafe',
                      color: union.typeUnion === 'Mariage' ? '#991b1b' : '#1e40af',
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}>
                      {union.typeUnion}
                    </span>
                  </td>
                  <td className="hide-md">{union.dateUnion || '-'}</td>
                  <td className="hide-lg">{union.lieuUnion || '-'}</td>
                  <td className="hide-md">
                    {union.dateFin ? (
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.375rem',
                        backgroundColor: '#fef3c7',
                        color: '#b45309',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        {union.typeFinUnion}
                      </span>
                    ) : (
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.375rem',
                        backgroundColor: '#dcfce7',
                        color: '#15803d',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        En cours
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="actions">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(union)}
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(union.id)}
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
              {editingUnion ? 'Modifier l\'union' : 'Ajouter une union'}
            </DialogTitle>
          </DialogHeader>
          <DialogBody>
            <form onSubmit={handleSubmit} id="union-form">
              <div className="form-row">
                <div className="form-group">
                  <Label htmlFor="conjoint1Id">Conjoint 1 *</Label>
                  <Select
                    id="conjoint1Id"
                    name="conjoint1Id"
                    value={formData.conjoint1Id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Sélectionner une personne</option>
                    <option value="1">Jean Dupont</option>
                    <option value="2">Marie Martin</option>
                    <option value="3">Pierre Durand</option>
                  </Select>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    Sélectionnez dans la liste des personnes enregistrées
                  </p>
                </div>
                <div className="form-group">
                  <Label htmlFor="conjoint2Id">Conjoint 2 *</Label>
                  <Select
                    id="conjoint2Id"
                    name="conjoint2Id"
                    value={formData.conjoint2Id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Sélectionner une personne</option>
                    <option value="1">Jean Dupont</option>
                    <option value="2">Marie Martin</option>
                    <option value="3">Pierre Durand</option>
                  </Select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <Label htmlFor="typeUnion">Type d'union *</Label>
                  <Select
                    id="typeUnion"
                    name="typeUnion"
                    value={formData.typeUnion}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Sélectionner</option>
                    <option value="Mariage">Mariage</option>
                    <option value="PACS">PACS</option>
                    <option value="Union libre">Union libre</option>
                  </Select>
                </div>
                <div className="form-group">
                  <Label htmlFor="dateUnion">Date d'union *</Label>
                  <Input
                    id="dateUnion"
                    name="dateUnion"
                    type="date"
                    value={formData.dateUnion}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <Label htmlFor="lieuUnion">Lieu d'union</Label>
                <Input
                  id="lieuUnion"
                  name="lieuUnion"
                  value={formData.lieuUnion}
                  onChange={handleChange}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <Label htmlFor="dateFin">Date de fin (optionnel)</Label>
                  <Input
                    id="dateFin"
                    name="dateFin"
                    type="date"
                    value={formData.dateFin}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <Label htmlFor="typeFinUnion">Type de fin</Label>
                  <Select
                    id="typeFinUnion"
                    name="typeFinUnion"
                    value={formData.typeFinUnion}
                    onChange={handleChange}
                    disabled={!formData.dateFin}
                  >
                    <option value="">Sélectionner</option>
                    <option value="Divorce">Divorce</option>
                    <option value="Décès">Décès</option>
                    <option value="Séparation">Séparation</option>
                  </Select>
                </div>
              </div>

              <div className="form-group">
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  name="notes"
                  className="textarea"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Informations supplémentaires..."
                />
              </div>
            </form>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Annuler
            </Button>
            <Button type="submit" form="union-form">
              {editingUnion ? 'Modifier' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
