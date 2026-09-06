"""Dashboard API — global and per-project metrics for the Dashboard screen."""

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.project import Project
from app.models.site import Site
from app.models.material import Material
from app.models.audit import AuditEvent

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Global dashboard statistics for the landing screen."""
    total_projects = db.query(func.count(Project.id)).scalar() or 0
    total_sites = db.query(func.count(Site.id)).scalar() or 0
    total_materials = db.query(func.count(Material.id)).scalar() or 0

    # Active projects (those with at least one site)
    active_projects = (
        db.query(func.count(func.distinct(Site.project_id)))
        .scalar() or 0
    )

    # Recent activity
    recent_events = (
        db.query(AuditEvent)
        .order_by(AuditEvent.created_at.desc())
        .limit(10)
        .all()
    )

    return {
        "total_projects": total_projects,
        "active_projects": active_projects,
        "total_sites": total_sites,
        "total_materials": total_materials,
        "recent_activity": [
            {
                "id": e.id,
                "action": e.action,
                "object_type": e.object_type,
                "object_id": e.object_id,
                "created_at": e.created_at.isoformat() if e.created_at else None,
            }
            for e in recent_events
        ],
    }
