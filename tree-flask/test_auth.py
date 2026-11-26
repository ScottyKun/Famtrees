"""
Test manuel de l'authentification Flask, sans Postgres ni Spring :
SQLite en mémoire + Spring simulé.

Lancer avec : python3 test_auth.py
"""
import os
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

import time
from unittest import mock

import jwt

import auth
from app import create_app
from CRUD.extensions import db

app = create_app()
with app.app_context():
    db.create_all()

c = app.test_client()
COOKIE = auth.COOKIE_NAME
ok = True


def check(label, cond):
    global ok
    ok = ok and cond
    print(f"[{'OK ' if cond else 'FAIL'}] {label}")


ANDY = {"email": "Andy@Test.fr", "password": "motdepasse123", "prenom": "Andy", "nom": "Test"}

# ── Inscription / connexion ──────────────────────────────────────────
r = c.post("/api/auth/register", json=ANDY)
check("inscription → 201", r.status_code == 201)
set_cookie = r.headers.get("Set-Cookie", "")
check("cookie HttpOnly + SameSite=Strict", "HttpOnly" in set_cookie and "SameSite=Strict" in set_cookie)
check("aucun jeton ni hash dans le corps", "token" not in r.get_json() and "password_hash" not in r.get_json())
check("email enregistré en minuscules", r.get_json()["email"] == "andy@test.fr")
andy_id = r.get_json()["id"]

check("me avec le cookie → 200", c.get("/api/auth/me").status_code == 200)
check("même email (autre casse) → 409", c.post("/api/auth/register", json={**ANDY, "email": "andy@test.fr"}).status_code == 409)
check("inscription invalide → 400", c.post("/api/auth/register", json={"email": "x", "password": "court"}).status_code == 400)

anon = app.test_client()
check("sans cookie → 401", anon.get("/api/auth/me").status_code == 401)
check("mauvais mot de passe → 401", anon.post("/api/auth/login", json={"email": "andy@test.fr", "password": "faux"}).status_code == 401)
check("email inconnu → 401", anon.post("/api/auth/login", json={"email": "nobody@test.fr", "password": "faux"}).status_code == 401)
r = anon.post("/api/auth/login", json={"email": "ANDY@test.fr", "password": "motdepasse123"})
check("connexion → 200 + cookie", r.status_code == 200 and COOKIE in r.headers.get("Set-Cookie", ""))

# ── Jetons invalides ─────────────────────────────────────────────────
def bearer(token):
    return {"Authorization": f"Bearer {token}"}
now = int(time.time())
forged = jwt.encode({"iss": "famtrees", "sub": andy_id, "iat": now, "exp": now + 60}, "x" * 40, algorithm="HS256")
expired = jwt.encode({"iss": "famtrees", "sub": andy_id, "iat": now - 7200, "exp": now - 3600}, auth.JWT_SECRET, algorithm="HS256")
other_iss = jwt.encode({"iss": "autre", "sub": andy_id, "iat": now, "exp": now + 60}, auth.JWT_SECRET, algorithm="HS256")
check("jeton signé avec un autre secret → 401", anon.get("/api/auth/me", headers=bearer(forged)).status_code == 401)
check("jeton expiré → 401", anon.get("/api/auth/me", headers=bearer(expired)).status_code == 401)
check("autre émetteur → 401", anon.get("/api/auth/me", headers=bearer(other_iss)).status_code == 401)
check("routes métier protégées (arbres) → 401", app.test_client().get("/api/arbres").status_code == 401)

# ── CRUD utilisateurs (tout utilisateur connecté) ────────────────────
r = c.post("/api/users", json={"email": "lea@test.fr", "password": "motdepasse123", "prenom": "Léa", "nom": "Petit"})
check("créer un utilisateur → 201", r.status_code == 201)
lea_id = r.get_json()["id"]
check("lister → 2 comptes", len(c.get("/api/users").get_json()) == 2)
r = c.put(f"/api/users/{lea_id}", json={"nom": "Petit-Dupont", "personne_id": "4:abc:12"})
check("modifier sans changer le mot de passe → 200", r.status_code == 200 and r.get_json()["personne_id"] == "4:abc:12")
check("Léa se connecte toujours avec son mot de passe",
      app.test_client().post("/api/auth/login", json={"email": "lea@test.fr", "password": "motdepasse123"}).status_code == 200)
c.put(f"/api/users/{lea_id}", json={"password": "nouveaumotdepasse"})
check("nouveau mot de passe pris en compte",
      app.test_client().post("/api/auth/login", json={"email": "lea@test.fr", "password": "nouveaumotdepasse"}).status_code == 200)
check("changer pour un email déjà pris → 409", c.put(f"/api/users/{lea_id}", json={"email": "andy@test.fr"}).status_code == 409)

lea = app.test_client()
lea.post("/api/auth/login", json={"email": "lea@test.fr", "password": "nouveaumotdepasse"})
check("supprimer Léa → 200", c.delete(f"/api/users/{lea_id}").status_code == 200)
check("la session de Léa est refusée aussitôt", lea.get("/api/auth/me").status_code == 401)

r = c.delete(f"/api/users/{andy_id}")
check("se supprimer soi-même efface le cookie", r.status_code == 200 and r.get_json()["self"] and f"{COOKIE}=;" in r.headers.get("Set-Cookie", ""))

# ── Déconnexion ──────────────────────────────────────────────────────
r = c.post("/api/auth/logout")
check("déconnexion efface le cookie", r.status_code == 200 and f"{COOKIE}=;" in r.headers.get("Set-Cookie", ""))

# ── Transmission du jeton à Spring ───────────────────────────────────
d = app.test_client()
d.post("/api/auth/register", json={**ANDY, "email": "dev@test.fr"})
class R:
    status_code = 200
    def json(self):
        return {"racineId": "4:p", "profondeur": 4, "edges": [],
                "nodes": [{"id": "4:p", "type": "PERSONNE", "data": {"prenom": "A", "nom": "B", "sexe": "M"}}]}
with mock.patch("tree_route.requests.get", return_value=R()) as get:
    r = d.get("/api/tree/4:p")
    sent = get.call_args.kwargs["headers"]["Authorization"]
    check("le jeton du cookie est transmis à Spring en Bearer", r.status_code == 200 and sent.startswith("Bearer ey"))

print()
print("TOUT EST OK" if ok else "ÉCHECS CI-DESSUS")
