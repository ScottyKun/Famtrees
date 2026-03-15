from flask import Flask
from flask_cors import CORS
from tree_route import tree_bp
from CRUD.extensions import db, migrate
from CRUD.arbre_route import arbre_bp


def create_app():
    app = Flask(__name__)

    # Autoriser React à appeler Flask
    CORS(app)

    # ── Config PostgreSQL 
    app.config["SQLALCHEMY_DATABASE_URI"] = (
        "postgresql://admin:admin@localhost:5433/famtreeBD"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
 
    # ── Extensions 
    db.init_app(app)
    migrate.init_app(app, db)

    # Enregistrer les routes
    app.register_blueprint(tree_bp, url_prefix="/api")
    app.register_blueprint(arbre_bp, url_prefix="/api")

    return app


app = create_app()


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )
