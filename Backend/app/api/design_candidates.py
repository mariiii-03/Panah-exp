import json

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.site_profiles import get_profile
from app.api.design_specifications import get_specification
from app.constraints.schemas import (
    ConstraintSet,
    OccupancyConstraint,
    SiteConstraint,
    MaterialConstraint,
    EnvironmentConstraint,
)
from app.core.database import get_db
from app.generator.service import LocalGenerationService
from app.generator.converter import candidate_to_design_version
from app.models.design_candidate import DesignCandidate
from app.schemas.design_candidate import (
    DesignCandidatePayload,
    DesignCandidateResponse,
)
from app.services.audit import log_event

router = APIRouter(
    prefix="/projects/{project_id}/sites/{site_id}/design-candidates",
    tags=["Design Candidates"],
)


@router.post(
    "/generate",
    response_model=DesignCandidateResponse,
    status_code=201,
)
def generate_design_candidate(
    project_id: int,
    site_id: int,
    db: Session = Depends(get_db),
):
    site_profile = get_profile(project_id, site_id, db)
    specification = get_specification(project_id, site_id, db)

    if site_profile.status != "ready":
        raise HTTPException(
            status_code=422,
            detail="Site profile must be ready before generation",
        )

    if specification.status != "ready":
        raise HTTPException(
            status_code=422,
            detail="Design specification must be ready before generation",
        )

    site_profile_data = json.loads(site_profile.profile_json)
    specification_data = json.loads(specification.specification_json)

    # Build a ConstraintSet from the site profile + specification
    # so the generator produces varied, constraint-aware designs.
    try:
        # Derive people from family_size or capacity
        people = specification_data.get("capacity") or specification_data.get("family_size") or 6

        # Derive site dimensions from profile geometry or default
        geo = site_profile_data.get("geometry", {})
        area = geo.get("estimated_usable_area_m2") or geo.get("area_m2")
        if area and area > 0:
            import math
            site_length = round(math.sqrt(area * 1.2), 2)
            site_width = round(area / site_length, 2)
        else:
            site_length = site_profile_data.get("length_m", 6.0)
            site_width = site_profile_data.get("width_m", 5.0)

        # Derive materials from spec or profile
        materials_raw = specification_data.get("materials") or specification_data.get("available_materials")
        if not materials_raw or not isinstance(materials_raw, list) or len(materials_raw) == 0:
            # Build from string list like ["bamboo", "steel"]
            mat_names = specification_data.get("preferred_materials") or site_profile_data.get("materials", ["steel"])
            if isinstance(mat_names, list) and len(mat_names) > 0 and isinstance(mat_names[0], str):
                materials_raw = [{
                    "id": f"MAT-{i+1:02d}",
                    "type": m,
                    "qty": 20,
                    "length_m": 4.0,
                    "diameter_m": 0.06,
                } for i, m in enumerate(mat_names[:3])]
            else:
                materials_raw = [{
                    "id": "MAT-DEFAULT",
                    "type": "steel",
                    "qty": 20,
                    "length_m": 4.0,
                    "diameter_m": 0.06,
                }]
        elif isinstance(materials_raw[0], str):
            materials_raw = [{
                "id": f"MAT-{i+1:02d}",
                "type": m,
                "qty": 20,
                "length_m": 4.0,
                "diameter_m": 0.06,
            } for i, m in enumerate(materials_raw[:3])]

        # Derive environment from terrain or profile
        terrain = site_profile_data.get("terrain", [])
        environment = "semi-arid, moderate wind zone"
        if isinstance(terrain, list) and len(terrain) > 0:
            environment = terrain[0]

        constraints = ConstraintSet(
            version="auto",
            occupancy=OccupancyConstraint(people=people),
            site=SiteConstraint(length_m=site_length, width_m=site_width),
            materials=[
                MaterialConstraint.model_validate(m) for m in materials_raw
            ],
            environment=EnvironmentConstraint(scenario=environment),
            design_target="roof_truss",
        )
    except Exception as exc:
        raise HTTPException(
            status_code=422,
            detail=f"Could not build constraints from profile/spec: {exc}",
        ) from exc

    # Generate 3 varied candidates using the constraint-aware generator
    generator = LocalGenerationService()
    try:
        candidates = generator.generate_candidates(constraints)
        # Use the first candidate as the primary output
        candidate = candidates[0]
        design_version = candidate_to_design_version(
            candidate, version=f"DC-{candidate.candidate_id}",
        )
        validated = DesignCandidatePayload.model_validate(
            design_version.model_dump()
        )
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Design generator returned invalid output: {exc}",
        ) from exc

    input_snapshot = {
        "site_profile": site_profile_data,
        "design_specification": specification_data,
        "constraints": constraints.model_dump(),
        "candidate_count": len(candidates),
        "candidates_types": [c.design_type for c in candidates],
    }

    candidate_record = DesignCandidate(
        site_id=site_id,
        design_specification_id=specification.id,
        status="generated",
        generator_name=generator.__class__.__name__,
        generator_version="2.0",
        candidate_json=validated.model_dump_json(),
        input_snapshot_json=json.dumps(input_snapshot),
    )

    db.add(candidate_record)
    db.commit()
    db.refresh(candidate_record)

    log_event(
        db,
        project_id=project_id,
        action="design_candidate_generated",
        object_type="design_candidate",
        object_id=str(candidate_record.id),
        details={
            "site_id": site_id,
            "generator": generator.__class__.__name__,
            "specification_id": specification.id,
            "candidates_generated": len(candidates),
            "design_types": [c.design_type for c in candidates],
        },
    )
    db.commit()

    return candidate_record


@router.get("", response_model=list[DesignCandidateResponse])
def list_design_candidates(
    project_id: int,
    site_id: int,
    db: Session = Depends(get_db),
):
    # Validate site through the existing profile/specification ownership checks.
    get_profile(project_id, site_id, db)

    candidates = (
        db.query(DesignCandidate)
        .filter(DesignCandidate.site_id == site_id)
        .order_by(DesignCandidate.created_at.desc())
        .all()
    )

    return candidates


@router.get("/{candidate_id}", response_model=DesignCandidateResponse)
def get_design_candidate(
    project_id: int,
    site_id: int,
    candidate_id: int,
    db: Session = Depends(get_db),
):
    get_profile(project_id, site_id, db)

    candidate = db.get(DesignCandidate, candidate_id)

    if candidate is None or candidate.site_id != site_id:
        raise HTTPException(
            status_code=404,
            detail="Design candidate not found",
        )

    return candidate


@router.patch("/{candidate_id}/status", response_model=DesignCandidateResponse)
def update_design_candidate_status(
    project_id: int,
    site_id: int,
    candidate_id: int,
    status: str,
    db: Session = Depends(get_db),
):
    get_profile(project_id, site_id, db)

    if status not in {"selected", "rejected"}:
        raise HTTPException(
            status_code=422,
            detail="Status must be selected or rejected",
        )

    candidate = db.get(DesignCandidate, candidate_id)

    if candidate is None or candidate.site_id != site_id:
        raise HTTPException(
            status_code=404,
            detail="Design candidate not found",
        )

    candidate.status = status
    db.commit()
    db.refresh(candidate)

    return candidate
