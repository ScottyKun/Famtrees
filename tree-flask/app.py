from flask import Flask
from flask_cors import CORS
from tree_route import tree_bp


def create_app():
    app = Flask(__name__)

    # Autoriser React à appeler Flask
    CORS(app)

    # Enregistrer les routes
    app.register_blueprint(tree_bp, url_prefix="/api")

    return app


app = create_app()


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=True
    )
