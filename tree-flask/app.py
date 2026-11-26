import os

# Doit passer AVANT les autres imports : auth.py lit JWT_SECRET à l'import.
# En dev : charge tree-flask/.env (copie de .env.example). En prod (Docker),
# pas de fichier : les variables viennent de deploy/env/flask.env.
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

from flask import Flask
from flask_cors import CORS
from auth import init_auth
from tree_route import tree_bp
from CRUD.extensions import db, migrate
from CRUD.arbre_route import arbre_bp
from CRUD.auth_route import auth_bp
from CRUD.user_route import users_bp


def create_app():
    app = Flask(__name__)

    # Autoriser le front React (et lui seul) à appeler Flask
    origins = os.environ.get("CORS_ALLOWED_ORIGINS", "http://localhost:5173").split(",")
    # supports_credentials : le navigateur envoie le cookie de session (voir auth.py)
    CORS(app, origins=[o.strip() for o in origins],
         allow_headers=["Authorization", "Content-Type"], supports_credentials=True)

    # Toutes les routes exigent un JWT valide (voir auth.py)
    init_auth(app)

    # ── Config PostgreSQL 
    # DATABASE_URL permettra de passer l'URL par Docker / les secrets en prod
    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get(
        "DATABASE_URL", "postgresql://admin:admin@localhost:5432/UTexchangedb"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
 
    # ── Extensions 
    db.init_app(app)
    migrate.init_app(app, db)

    # Enregistrer les routes
    app.register_blueprint(tree_bp, url_prefix="/api")
    app.register_blueprint(arbre_bp, url_prefix="/api")
    app.register_blueprint(auth_bp,  url_prefix="/api")
    app.register_blueprint(users_bp, url_prefix="/api")

    return app


app = create_app()


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )
