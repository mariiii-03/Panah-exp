"""Project History API — enriched project listing with counts for the History screen."""

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.project import Project
from app.models.site import Site
from app.models.material import Material

router = APIRouter(prefix="/projects-history", tags=["Project History"])


@router.get("")
def list_projects_with_counts(db: Session = Depends(get_db)):
    """
    List all projects enriched with counts for the Project History screen.
    Returns site count and material count per project using optimized bulk queries.
    """
    projects = db.query(Project).order_by(Project.created_at.desc()).all()
    
    # Bulk aggregate counts to eliminate N+1 queries
    site_counts = dict(
        db.query(Site.project_id, func.count(Site.id))
        .group_by(Site.project_id)
        .all()
    )
    
    material_counts = dict(
        db.query(Material.project_id, func.count(Material.id))
        .group_by(Material.project_id)
        .all()
    )

    result = []
    for project in projects:
        result.append({
            "id": project.id,
            "name": project.name,
            "location": project.location,
            "status": project.status,
            "created_at": project.created_at.isoformat() if project.created_at else None,
            "site_count": site_counts.get(project.id, 0),
            "material_count": material_counts.get(project.id, 0),
        })

    return {
        "count": len(result),
        "projects": result,
    }



