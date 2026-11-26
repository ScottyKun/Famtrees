import uuid
from datetime import datetime, timezone
from CRUD.extensions import db


class User(db.Model):
    """
    Compte de connexion à l'application (PostgreSQL).

    Indépendant des Personne de l'arbre (Neo4j) : on peut créer autant de
    Personne que nécessaire pour remplir les familles sans leur donner de compte.
    personne_id permet, si on le souhaite, de relier un compte à "sa" fiche
    dans l'arbre (elementId Neo4j) — optionnel.
    """
    __tablename__ = "users"

    id            = db.Column(db.String,      primary_key=True, default=lambda: str(uuid.uuid4()))
    email         = db.Column(db.String(254), nullable=False, unique=True, index=True)  # toujours en minuscules
    password_hash = db.Column(db.String(255), nullable=False)
    prenom        = db.Column(db.String(100), nullable=False)
    nom           = db.Column(db.String(100), nullable=False)
    personne_id   = db.Column(db.String,      nullable=True)   # elementId Neo4j (optionnel)

    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, nullable=False,
                           default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        # Jamais le hash du mot de passe
        return {
            "id":          self.id,
            "email":       self.email,
            "prenom":      self.prenom,
            "nom":         self.nom,
            "personne_id": self.personne_id,
            "created_at":  self.created_at.isoformat(),
            "updated_at":  self.updated_at.isoformat(),
        }
