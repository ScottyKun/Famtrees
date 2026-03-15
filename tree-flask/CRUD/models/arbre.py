import uuid
from datetime import datetime, timezone
from CRUD.extensions import db


class Arbre(db.Model):
    __tablename__ = "arbres"

    id         = db.Column(db.String,   primary_key=True, default=lambda: str(uuid.uuid4()))
    nom        = db.Column(db.String,   nullable=False)
    racine_id  = db.Column(db.String,   nullable=False)   # elementId Neo4j
    depth      = db.Column(db.Integer,  nullable=False, default=3)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, nullable=False,
                           default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id":        self.id,
            "nom":       self.nom,
            "racine_id": self.racine_id,
            "depth":     self.depth,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }