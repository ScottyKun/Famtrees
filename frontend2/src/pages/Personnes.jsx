import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { personnesAPI } from '../services/api';
import { sanitizeFormData, escapeHtml } from '../utils/security';

// Données mockées pour la démonstration
const mockPersonnes = [
  { 
    id: '1', 
    prenom: 'Jean', 
    nom: 'Dupont', 
    sexe: 'M', 
    dateNaissance: '1980-05-15', 
    lieuNaissance: 'Paris',
    dateDeces: null,
    lieuDeces: null,
    email: 'jean.dupont@email.fr',
    telephone: '0612345678'
  },
  { 
    id: '2', 
    prenom: 'Marie', 
    nom: 'Martin', 
    sexe: 'F', 
    dateNaissance: '1982-08-22', 
    lieuNaissance: 'Lyon',
    dateDeces: null,
    lieuDeces: null,
    email: 'marie.martin@email.fr',
    telephone: '0623456789'
  },
  { 
    id: '3', 
    prenom: 'Pierre', 
    nom: 'Durand', 
    sexe: 'M', 
    dateNaissance: '1955-12-03', 
    lieuNaissance: 'Marseille',
    dateDeces: '2020-06-10',
    lieuDeces: 'Marseille',
    email: null,
    telephone: null
  },
];

const emptyForm = {
  prenom: '',
  nom: '',
  sexe: '',
  dateNaissance: '',
  lieuNaissance: '',
  dateDeces: '',
  lieuDeces: '',
  email: '',
  telephone: '',
};

export function Personnes() {
  const [personnes, setPersonnes] = useState(mockPersonnes);
  const [filteredPersonnes, setFilteredPersonnes] = useState(mockPersonnes);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPersonne, setEditingPersonne] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [useBackend, setUseBackend] = useState(false);

  useEffect(() => {
    if (useBackend) {
      loadPersonnesFromBackend();
    }
  }, [useBackend]);

  useEffect(() => {
    filterPersonnes();
  }, [searchTerm, personnes]);

  const loadPersonnesFromBackend = async () => {
    setLoading(true);
    try {
      const data = await personnesAPI.getAll();
      setPersonnes(data);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      alert('Erreur de connexion au backend. Utilisation des données mockées.');
      setUseBackend(false);
    } finally {
      setLoading(false);
    }
  };

  const filterPersonnes = () => {
    if (!searchTerm) {
      setFilteredPersonnes(personnes);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = personnes.filter(p => 
      p.prenom.toLowerCase().includes(term) ||
      p.nom.toLowerCase().includes(term) ||
      (p.lieuNaissance && p.lieuNaissance.toLowerCase().includes(term))
    );
    setFilteredPersonnes(filtered);
  };

  const handleOpenDialog = (personne = null) => {
    if (personne) {
      setEditingPersonne(personne);
      setFormData({ ...personne });
    } else {
      setEditingPersonne(null);
      setFormData(emptyForm);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingPersonne(null);
    setFormData(emptyForm);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation basique
    if (!formData.prenom || !formData.nom) {
      alert('Le prénom et le nom sont obligatoires');
      return;
    }

    // Sécurisation des données
    const sanitizedData = sanitizeFormData(formData);

    if (useBackend) {
      // Mode Backend
      try {
        if (editingPersonne) {
          const updated = await personnesAPI.update(editingPersonne.id, sanitizedData);
          setPersonnes(prev => prev.map(p => p.id === editingPersonne.id ? updated : p));
        } else {
          const created = await personnesAPI.create(sanitizedData);
          setPersonnes(prev => [...prev, created]);
        }
        handleCloseDialog();
      } catch (error) {
        alert('Erreur lors de l\'enregistrement: ' + error.message);
      }
    } else {
      // Mode Mock
      if (editingPersonne) {
        setPersonnes(prev => prev.map(p => 
          p.id === editingPersonne.id ? { ...sanitizedData, id: editingPersonne.id } : p
        ));
      } else {
        const newPersonne = {
          ...sanitizedData,
          id: Date.now().toString(),
        };
        setPersonnes(prev => [...prev, newPersonne]);
      }
      handleCloseDialog();
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette personne ?')) {
      return;
    }

    if (useBackend) {
      try {
        await personnesAPI.delete(id);
        setPersonnes(prev => prev.filter(p => p.id !== id));
      } catch (error) {
        alert('Erreur lors de la suppression: ' + error.message);
      }
    } else {
      setPersonnes(prev => prev.filter(p => p.id !== id));
    }
  };

  return (
    <div className="p-6">
      <div className="page-header">
        <div className="page-header-content">
          <h1>Personnes</h1>
          <p>Gérez les membres de votre arbre généalogique</p>
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
            Ajouter une personne
          </Button>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="search-container mb-6">
        <Search className="search-icon" />
        <Input
          type="text"
          placeholder="Rechercher par nom, prénom ou lieu..."
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
              <th>Nom complet</th>
              <th>Sexe</th>
              <th className="hide-md">Date de naissance</th>
              <th className="hide-lg">Lieu de naissance</th>
              <th className="hide-md">Contact</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPersonnes.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center" style={{ padding: '2rem' }}>
                  {searchTerm ? 'Aucun résultat trouvé' : 'Aucune personne enregistrée'}
                </td>
              </tr>
            ) : (
              filteredPersonnes.map((personne) => (
                <tr key={personne.id}>
                  <td>
                    <div style={{ fontWeight: '500' }}>
                      {escapeHtml(personne.prenom)} {escapeHtml(personne.nom)}
                    </div>
                    {personne.dateDeces && (
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                        † {personne.dateDeces}
                      </div>
                    )}
                  </td>
                  <td>{personne.sexe === 'M' ? '♂ Homme' : personne.sexe === 'F' ? '♀ Femme' : '-'}</td>
                  <td className="hide-md">{personne.dateNaissance || '-'}</td>
                  <td className="hide-lg">{personne.lieuNaissance || '-'}</td>
                  <td className="hide-md">
                    {personne.email || personne.telephone ? (
                      <div style={{ fontSize: '0.875rem' }}>
                        <div>{personne.email || '-'}</div>
                        <div style={{ color: '#6b7280' }}>{personne.telephone || '-'}</div>
                      </div>
                    ) : '-'}
                  </td>
                  <td>
                    <div className="actions">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenDialog(personne)}
                      >
                        <Pencil size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(personne.id)}
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
              {editingPersonne ? 'Modifier la personne' : 'Ajouter une personne'}
            </DialogTitle>
          </DialogHeader>
          <DialogBody>
            <form onSubmit={handleSubmit} id="personne-form">
              <div className="form-row">
                <div className="form-group">
                  <Label htmlFor="prenom">Prénom *</Label>
                  <Input
                    id="prenom"
                    name="prenom"
                    value={formData.prenom}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <Label htmlFor="nom">Nom *</Label>
                  <Input
                    id="nom"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <Label htmlFor="sexe">Sexe</Label>
                  <Select
                    id="sexe"
                    name="sexe"
                    value={formData.sexe}
                    onChange={handleChange}
                  >
                    <option value="">Sélectionner</option>
                    <option value="M">Homme</option>
                    <option value="F">Femme</option>
                  </Select>
                </div>
                <div className="form-group">
                  <Label htmlFor="dateNaissance">Date de naissance</Label>
                  <Input
                    id="dateNaissance"
                    name="dateNaissance"
                    type="date"
                    value={formData.dateNaissance}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <Label htmlFor="lieuNaissance">Lieu de naissance</Label>
                <Input
                  id="lieuNaissance"
                  name="lieuNaissance"
                  value={formData.lieuNaissance}
                  onChange={handleChange}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <Label htmlFor="dateDeces">Date de décès</Label>
                  <Input
                    id="dateDeces"
                    name="dateDeces"
                    type="date"
                    value={formData.dateDeces}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <Label htmlFor="lieuDeces">Lieu de décès</Label>
                  <Input
                    id="lieuDeces"
                    name="lieuDeces"
                    value={formData.lieuDeces}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <Label htmlFor="telephone">Téléphone</Label>
                  <Input
                    id="telephone"
                    name="telephone"
                    type="tel"
                    value={formData.telephone}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </form>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Annuler
            </Button>
            <Button type="submit" form="personne-form">
              {editingPersonne ? 'Modifier' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
