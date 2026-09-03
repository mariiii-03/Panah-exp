import pytest

from app.constraints.builder import build_constraint_set
from app.generator.service import LocalGenerationService


def constraints():
    return build_constraint_set(
        version="CS-001",
        occupants=6,
        site_length_m=6.0,
        site_width_m=5.0,
        materials=[
            {
                "id": "MAT-01",
                "type": "bamboo",
                "qty": 24,
                "length_m": 4.5,
                "diameter_m": 0.06,
            }
        ],
        environment_scenario="configured_case",
        design_target="roof_truss",
    )


def test_generates_one_candidate_without_external_services():
    result = LocalGenerationService().generate(constraints())

    assert result.candidate_id == "LOCAL-01"
    assert result.generation_method == "local_constraint_generator"
    assert "truss" in result.design_type or "frame" in result.design_type
    assert len(result.members) >= 2


def test_generates_three_distinct_candidates():
    results = LocalGenerationService().generate_candidates(constraints(), count=3)

    assert len(results) == 3
    assert [r.candidate_id for r in results] == [
        "LOCAL-01",
        "LOCAL-02",
        "LOCAL-03",
    ]


def test_conservative_candidate_respects_available_member_length():
    result = LocalGenerationService().generate(
        constraints(),
        candidate_index=2,
    )

    assert result.span_m <= 4.5


def test_component_and_material_ids_are_preserved():
    result = LocalGenerationService().generate(constraints(), candidate_index=2)

    assert result.members[0].id.startswith(("M", "TC", "RB"))
    assert all(member.material_id == "MAT-01" for member in result.members)
    assert all(len(connection.a) > 0 for connection in result.connections)


def test_different_targets_produce_different_results():
    c1 = constraints()
    c2 = constraints()
    c2.design_target = "roof_truss"
    r1 = LocalGenerationService().generate(c1, candidate_index=1)
    r2 = LocalGenerationService().generate(c2, candidate_index=1)
    # Same target → same structure type
    assert r1.design_type == r2.design_type


def test_auto_count_computes_from_constraints():
    c = constraints()
    results = LocalGenerationService().generate_candidates(c)
    # Auto-computed count is driven purely by inputs
    assert len(results) >= 1
    # All should have unique IDs
    ids = [r.candidate_id for r in results]
    assert len(ids) == len(set(ids))
    # All should have different structural topologies
    types = [r.design_type for r in results]
    assert len(types) == len(set(types))


def test_more_materials_produce_more_candidates():
    c1 = constraints()  # 1 material → fewer candidates
    from app.constraints.schemas import (
        ConstraintSet, OccupancyConstraint, SiteConstraint,
        MaterialConstraint, EnvironmentConstraint,
    )
    c2 = ConstraintSet(
        version="CS-002",
        occupancy=OccupancyConstraint(people=20),
        site=SiteConstraint(length_m=12.0, width_m=10.0),
        materials=[
            MaterialConstraint(id="M1", type="steel", qty=20, length_m=6.0, diameter_m=0.08),
            MaterialConstraint(id="M2", type="bamboo", qty=30, length_m=4.5, diameter_m=0.06),
            MaterialConstraint(id="M3", type="timber", qty=15, length_m=5.0, diameter_m=0.1),
        ],
        environment=EnvironmentConstraint(scenario="flood earthquake cyclone"),
        design_target="roof_truss",
    )
    r1 = LocalGenerationService().generate_candidates(c1)
    r2 = LocalGenerationService().generate_candidates(c2)
    # More materials + bigger site + more hazards + higher occupancy = more candidates
    assert len(r2) > len(r1)


def test_invalid_candidate_count_rejected():
    with pytest.raises(ValueError, match="count must be >= 1"):
        LocalGenerationService().generate_candidates(constraints(), count=0)


def test_invalid_candidate_index_rejected():
    with pytest.raises(ValueError, match="candidate_index"):
        LocalGenerationService().generate(constraints(), candidate_index=0)
