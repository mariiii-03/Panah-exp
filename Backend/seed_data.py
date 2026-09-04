"""Seed realistic humanitarian shelter projects and materials for Panagah."""
import os
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from app.core.database import Base, SessionLocal, engine
from app.models.project import Project
from app.models.site import Site
from app.models.material import Material
from app.models.audit import AuditEvent

def seed():
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        existing = db.query(Project).first()
        if existing:
            print("Database already contains projects. Skipping seed.")
            return

        print("Seeding initial humanitarian projects...")

        p1 = Project(name="Sindh Monsoon Flood Relief", location="Dadu District, Sindh, Pakistan")
        p1.status = "certified"
        db.add(p1)
        db.flush()

        s1 = Site(project_id=p1.id, name="Dadu Cluster Site 04", latitude=26.7329, longitude=67.7767, status="ready")
        db.add(s1)

        db.add(Material(project_id=p1.id, name="Treated Structural Bamboo", type="treated_bamboo", quantity=140, unit="poles", length_m=4.5, diameter_m=0.09))
        db.add(Material(project_id=p1.id, name="Corrugated Galvanized Iron (CGI) 28G", type="corrugated_tin", quantity=36, unit="sheets", length_m=3.0, diameter_m=0.001))
        db.add(Material(project_id=p1.id, name="Galvanized Steel Ties & Connectors", type="steel_connector", quantity=80, unit="pieces", length_m=0.2, diameter_m=0.02))

        p2 = Project(name="Swat Valley Winterized Prototype", location="Kalam, Swat, KP, Pakistan")
        p2.status = "in_progress"
        db.add(p2)
        db.flush()

        s2 = Site(project_id=p2.id, name="Ushu Valley Site 01", latitude=35.4958, longitude=72.5878, status="ready")
        db.add(s2)

        db.add(Material(project_id=p2.id, name="Reclaimed Pine Timber Beams", type="reclaimed_timber", quantity=95, unit="pieces", length_m=3.6, diameter_m=0.12))
        db.add(Material(project_id=p2.id, name="Stabilized Plinth Mud Bricks", type="stabilized_mud_brick", quantity=650, unit="blocks", length_m=0.23, diameter_m=0.11))

        p3 = Project(name="Balochistan Earthbag Community Hub", location="Sibi District, Balochistan, Pakistan")
        p3.status = "review"
        db.add(p3)
        db.flush()

        s3 = Site(project_id=p3.id, name="Nari Bank Relief Settlement", latitude=29.5448, longitude=67.8764, status="capture_pending")
        db.add(s3)

        p4 = Project(name="Muzaffarabad Mountain Resilient Unit", location="Muzaffarabad, AJK")
        p4.status = "draft"
        db.add(p4)
        db.flush()

        s4 = Site(project_id=p4.id, name="Neelum Confluence Site B", latitude=34.3688, longitude=73.4714, status="capture_pending")
        db.add(s4)

        # Audit events
        db.add(AuditEvent(project_id=p1.id, actor_id="system", action="SEED_DATABASE", object_type="project", object_id=str(p1.id), details_json='{"note": "Initial demonstration shelter projects loaded"}'))

        db.commit()
        print("Successfully seeded 4 demonstration projects with sites and materials!")
    finally:
        db.close()

if __name__ == "__main__":
    seed()
