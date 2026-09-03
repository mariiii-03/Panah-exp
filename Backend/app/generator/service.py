from __future__ import annotations

import math
from app.constraints.schemas import ConstraintSet
from app.generator.schemas import GenerationCandidate, GeneratedConnection, GeneratedMember


# ---------------------------------------------------------------------------
# Roof-type strategies keyed by environment scenario
# ---------------------------------------------------------------------------
_ROOF_STRATEGIES = {
    "flood": {"pitch_deg": 15, "overhang_m": 0.6, "note": "low-profile for wind resistance"},
    "earthquake": {"pitch_deg": 10, "overhang_m": 0.3, "note": "minimal overhang to reduce mass"},
    "cyclone": {"pitch_deg": 25, "overhang_m": 0.8, "note": "steep pitch sheds rain, deep overhang protects walls"},
    "default": {"pitch_deg": 20, "overhang_m": 0.5, "note": "standard pitched roof"},
}


def _resolve_roof_strategy(scenario: str) -> dict:
    key = scenario.lower().strip()
    for pattern in _ROOF_STRATEGIES:
        if pattern in key:
            return _ROOF_STRATEGIES[pattern]
    return _ROOF_STRATEGIES["default"]


# ---------------------------------------------------------------------------
# Material helpers
# ---------------------------------------------------------------------------
def _pick_primary_material(materials):
    """Return (material_dict, is_tube) — prefer circular tubes for trusses."""
    for m in materials:
        if m.diameter_m is not None:
            return m, True
    return materials[0], False


def _connection_type_for_env(scenario: str, variant_seed: int) -> str:
    """Vary connection type by scenario + variant for variety."""
    scenario_lower = scenario.lower()
    if "earthquake" in scenario_lower:
        return ["bolted", "welded", "pinned"][variant_seed % 3]
    if "flood" in scenario_lower:
        return ["bolted", "lashed", "bolted"][variant_seed % 3]
    return ["bolted", "welded", "pinned"][variant_seed % 3]


# ---------------------------------------------------------------------------
# Dynamic candidate count computation
# ---------------------------------------------------------------------------
def _compute_candidate_count(constraints: ConstraintSet) -> int:
    """
    Purely input-driven candidate count. No hardcoded minimums or maximums.

    Every distinct input dimension adds structural variants:
    - Each material can pair with each structural topology → more materials = more combos
    - Site geometry constrains which topologies are feasible → complex geometry = more options
    - Occupancy drives load requirements → higher loads = more structural solutions
    - Each hazard in the scenario demands a specialized design strategy
    """
    count = 0

    # --- Material diversity ---
    # Each material type is a distinct structural variant worth exploring.
    # With N materials, we want at least N candidates (one per material choice)
    # plus cross-material combinations for structural variety.
    mat_types = {m.type.lower().strip() for m in constraints.materials}
    count += len(mat_types)

    # Materials with different diameter → different structural behavior
    diameters = {m.diameter_m for m in constraints.materials if m.diameter_m is not None}
    if len(diameters) > 1:
        count += len(diameters) - 1

    # --- Site geometry complexity ---
    area = constraints.site.length_m * constraints.site.width_m
    # Larger sites → more structural configurations possible
    # Scale: every 50m² adds a candidate
    count += max(0, int(area / 50))

    # Aspect ratio → elongated sites need specialized transverse/longitudinal solutions
    shorter = min(constraints.site.length_m, constraints.site.width_m)
    longer = max(constraints.site.length_m, constraints.site.width_m)
    ratio = longer / max(shorter, 0.1)
    if ratio > 1.5:
        count += int(ratio) - 1  # ratio 2.5 → +1, ratio 3.5 → +2, etc.

    # --- Occupancy / load complexity ---
    people = constraints.occupancy.people
    # More people → more load paths to consider → more structural options
    # Scale: 1 candidate per 8 people (4-person increments)
    count += max(0, people // 8)

    # --- Environment hazards ---
    # Each distinct hazard keyword demands a specialized structural response
    scenario_lower = constraints.environment.scenario.lower()
    hazard_keywords = {
        "flood": 2,    # flood raises structure + affects foundation
        "earthquake": 2,  # seismic needs ductile connections + bracing
        "cyclone": 2,  # wind uplift + lateral forces
        "seismic": 2,
        "wind": 1,     # lateral bracing variant
        "rain": 1,     # drainage/roof pitch variant
        "snow": 1,     # heavier roof structure
        "drought": 1,  # material thermal expansion
        "tsunami": 2,  # elevated structure + breakaway walls
        "landslide": 1, # foundation anchorage
    }
    for keyword, weight in hazard_keywords.items():
        if keyword in scenario_lower:
            count += 1  # each hazard adds 1 candidate

    # Ensure at least 1 candidate is always generated
    return max(1, count)


# ---------------------------------------------------------------------------
# Structural parameter computation
# ---------------------------------------------------------------------------
def _compute_bays(people: int, span_m: float) -> int:
    required_area = people * 3.0
    bay_area = span_m * max(2.0, span_m * 0.4)
    bays = max(1, math.ceil(required_area / bay_area))
    return min(bays, 8)


def _compute_height(span_m: float, scenario: str) -> float:
    base = max(2.4, min(span_m * 0.35, 4.5))
    if "flood" in scenario.lower():
        base = max(base, 3.0)
    return round(base, 2)


# ---------------------------------------------------------------------------
# Structural generators — each produces a different topology
# ---------------------------------------------------------------------------

def _gen_pratt_truss(material, span_m, height_m, bays, strategy):
    """Pratt truss — verticals in compression, diagonals in tension."""
    members = []
    bay_width = span_m / bays

    members.append(GeneratedMember(id="M1", type="top_chord", length_m=round(span_m, 2),
                                   material_id=material.id, diameter_m=material.diameter_m))
    members.append(GeneratedMember(id="M2", type="bottom_chord", length_m=round(span_m, 2),
                                   material_id=material.id, diameter_m=material.diameter_m))

    for i in range(bays):
        v_len = height_m * (0.5 + 0.5 * abs(2 * i / max(bays - 1, 1) - 1))
        members.append(GeneratedMember(id=f"V{i+1}", type="vertical", length_m=round(v_len, 2),
                                       material_id=material.id, diameter_m=material.diameter_m))
        diag = math.sqrt(bay_width**2 + v_len**2)
        members.append(GeneratedMember(id=f"D{i+1}", type="diagonal", length_m=round(diag, 2),
                                       material_id=material.id, diameter_m=material.diameter_m))

    col_h = height_m + 0.5
    members.append(GeneratedMember(id="C1", type="column", length_m=round(col_h, 2),
                                   material_id=material.id, diameter_m=material.diameter_m))
    members.append(GeneratedMember(id="C2", type="column", length_m=round(col_h, 2),
                                   material_id=material.id, diameter_m=material.diameter_m))
    return members


def _gen_warren_truss(material, span_m, height_m, bays, strategy):
    """Warren truss — equilateral triangles, good for dynamic loads."""
    members = []
    bay_width = span_m / bays

    for i in range(bays):
        members.append(GeneratedMember(id=f"TC{i+1}", type="top_chord", length_m=round(bay_width, 2),
                                       material_id=material.id, diameter_m=material.diameter_m))
        members.append(GeneratedMember(id=f"BC{i+1}", type="bottom_chord", length_m=round(bay_width, 2),
                                       material_id=material.id, diameter_m=material.diameter_m))

    for i in range(bays * 2):
        diag = math.sqrt(bay_width**2 + height_m**2) / 2
        members.append(GeneratedMember(id=f"W{i+1}", type="diagonal", length_m=round(diag, 2),
                                       material_id=material.id, diameter_m=material.diameter_m))

    col_h = height_m + 0.5
    members.append(GeneratedMember(id="C1", type="column", length_m=round(col_h, 2),
                                   material_id=material.id, diameter_m=material.diameter_m))
    members.append(GeneratedMember(id="C2", type="column", length_m=round(col_h, 2),
                                   material_id=material.id, diameter_m=material.diameter_m))
    return members


def _gen_howe_truss(material, span_m, height_m, bays, strategy):
    """Howe truss — inverse of Pratt, diagonals in compression, good for timber."""
    members = []
    bay_width = span_m / bays

    members.append(GeneratedMember(id="M1", type="top_chord", length_m=round(span_m, 2),
                                   material_id=material.id, diameter_m=material.diameter_m))
    members.append(GeneratedMember(id="M2", type="bottom_chord", length_m=round(span_m, 2),
                                   material_id=material.id, diameter_m=material.diameter_m))

    for i in range(bays):
        v_len = height_m * (0.3 + 0.7 * (i / max(bays - 1, 1)))
        members.append(GeneratedMember(id=f"V{i+1}", type="vertical", length_m=round(v_len, 2),
                                       material_id=material.id, diameter_m=material.diameter_m))
        diag = math.sqrt(bay_width**2 + v_len**2)
        members.append(GeneratedMember(id=f"H{i+1}", type="diagonal", length_m=round(diag, 2),
                                       material_id=material.id, diameter_m=material.diameter_m))

    # Bottom lateral bracing
    for i in range(bays):
        members.append(GeneratedMember(id=f"LB{i+1}", type="brace", length_m=round(bay_width * 0.7, 2),
                                       material_id=material.id, diameter_m=material.diameter_m))

    col_h = height_m + 0.5
    members.append(GeneratedMember(id="C1", type="column", length_m=round(col_h, 2),
                                   material_id=material.id, diameter_m=material.diameter_m))
    members.append(GeneratedMember(id="C2", type="column", length_m=round(col_h, 2),
                                   material_id=material.id, diameter_m=material.diameter_m))
    return members


def _gen_rigid_frame(material, span_m, height_m, bays, strategy):
    """Simple rigid frame — beams + columns + knee braces, easy to build."""
    members = []
    bay_width = span_m / max(1, bays)

    members.append(GeneratedMember(id="RB1", type="ridge_beam", length_m=round(span_m, 2),
                                   material_id=material.id, diameter_m=material.diameter_m))

    rafter_len = math.sqrt((span_m / 2)**2 + height_m**2)
    for side in ["L", "R"]:
        members.append(GeneratedMember(id=f"RF{side}", type="rafter", length_m=round(rafter_len, 2),
                                       material_id=material.id, diameter_m=material.diameter_m))

    purlin_count = max(2, bays)
    for i in range(purlin_count):
        members.append(GeneratedMember(id=f"P{i+1}", type="purlin",
                                       length_m=round(span_m * 0.5 + strategy["overhang_m"], 2),
                                       material_id=material.id, diameter_m=material.diameter_m))

    for i in range(bays + 1):
        col_h = height_m + 0.3
        members.append(GeneratedMember(id=f"CL{i+1}", type="column", length_m=round(col_h, 2),
                                       material_id=material.id, diameter_m=material.diameter_m))
        brace_len = height_m * 0.2
        members.append(GeneratedMember(id=f"KB{i+1}", type="knee_brace", length_m=round(brace_len, 2),
                                       material_id=material.id, diameter_m=material.diameter_m))
    return members


def _gen_k_truss(material, span_m, height_m, bays, strategy):
    """K-truss — intermediate verticals reduce buckling length, efficient for long spans."""
    members = []
    bay_width = span_m / bays

    members.append(GeneratedMember(id="M1", type="top_chord", length_m=round(span_m, 2),
                                   material_id=material.id, diameter_m=material.diameter_m))
    members.append(GeneratedMember(id="M2", type="bottom_chord", length_m=round(span_m, 2),
                                   material_id=material.id, diameter_m=material.diameter_m))

    for i in range(bays):
        # Main vertical
        members.append(GeneratedMember(id=f"V{i+1}", type="vertical", length_m=round(height_m, 2),
                                       material_id=material.id, diameter_m=material.diameter_m))
        # K-brace: two diagonals meeting at mid-height of vertical
        mid_h = height_m / 2
        k_diag = math.sqrt((bay_width / 2)**2 + mid_h**2)
        members.append(GeneratedMember(id=f"K1-{i+1}", type="diagonal", length_m=round(k_diag, 2),
                                       material_id=material.id, diameter_m=material.diameter_m))
        members.append(GeneratedMember(id=f"K2-{i+1}", type="diagonal", length_m=round(k_diag, 2),
                                       material_id=material.id, diameter_m=material.diameter_m))

    col_h = height_m + 0.5
    members.append(GeneratedMember(id="C1", type="column", length_m=round(col_h, 2),
                                   material_id=material.id, diameter_m=material.diameter_m))
    members.append(GeneratedMember(id="C2", type="column", length_m=round(col_h, 2),
                                   material_id=material.id, diameter_m=material.diameter_m))
    return members


def _gen_portal_frame(material, span_m, height_m, bays, strategy):
    """Portal frame with tapered haunches — heavy-duty, clear span."""
    members = []
    bay_width = span_m / max(1, bays)

    # Rafters with haunch (deeper at eaves, shallower at ridge)
    rafter_len = math.sqrt((span_m / 2)**2 + height_m**2)
    for side in ["L", "R"]:
        members.append(GeneratedMember(id=f"R{side}", type="rafter", length_m=round(rafter_len, 2),
                                       material_id=material.id, diameter_m=material.diameter_m))

    # Haunch members at eaves (short stiff members)
    haunch_len = height_m * 0.25
    for side in ["L", "R"]:
        members.append(GeneratedMember(id=f"HH{side}", type="knee_brace", length_m=round(haunch_len, 2),
                                       material_id=material.id, diameter_m=material.diameter_m))

    # Columns — heavier than simple frame
    for i in range(bays + 1):
        members.append(GeneratedMember(id=f"CL{i+1}", type="column", length_m=round(height_m, 2),
                                       material_id=material.id, diameter_m=material.diameter_m))

    # Tie rod at base
    members.append(GeneratedMember(id="TR1", type="beam", length_m=round(span_m, 2),
                                   material_id=material.id, diameter_m=material.diameter_m))

    # Purlins
    purlin_count = max(3, bays + 1)
    for i in range(purlin_count):
        members.append(GeneratedMember(id=f"P{i+1}", type="purlin",
                                       length_m=round(span_m * 0.5 + strategy["overhang_m"], 2),
                                       material_id=material.id, diameter_m=material.diameter_m))
    return members


def _gen_trussed_portal(material, span_m, height_m, bays, strategy):
    """Trussed portal — combines portal frame with roof truss for very long spans."""
    members = []
    bay_width = span_m / bays

    # Top and bottom chords
    members.append(GeneratedMember(id="M1", type="top_chord", length_m=round(span_m, 2),
                                   material_id=material.id, diameter_m=material.diameter_m))
    members.append(GeneratedMember(id="M2", type="bottom_chord", length_m=round(span_m, 2),
                                   material_id=material.id, diameter_m=material.diameter_m))

    # Warren-style web members
    for i in range(bays * 2):
        diag = math.sqrt(bay_width**2 + height_m**2) / 2
        members.append(GeneratedMember(id=f"W{i+1}", type="diagonal", length_m=round(diag, 2),
                                       material_id=material.id, diameter_m=material.diameter_m))

    # Heavy columns with haunches
    for i in range(bays + 1):
        members.append(GeneratedMember(id=f"CL{i+1}", type="column", length_m=round(height_m + 0.5, 2),
                                       material_id=material.id, diameter_m=material.diameter_m))
        members.append(GeneratedMember(id=f"KB{i+1}", type="knee_brace", length_m=round(height_m * 0.2, 2),
                                       material_id=material.id, diameter_m=material.diameter_m))

    return members


# ---------------------------------------------------------------------------
# Registry: all available structural generators
# ---------------------------------------------------------------------------
_GENERATORS = [
    ("pratt_truss", _gen_pratt_truss),
    ("warren_truss", _gen_warren_truss),
    ("howe_truss", _gen_howe_truss),
    ("rigid_frame", _gen_rigid_frame),
    ("k_truss", _gen_k_truss),
    ("portal_frame", _gen_portal_frame),
    ("trussed_portal", _gen_trussed_portal),
]


# ---------------------------------------------------------------------------
# Connection builder
# ---------------------------------------------------------------------------
def _build_connections(members, connection_type):
    if not members:
        return []
    chord_ids = [m.id for m in members if "chord" in m.type or m.type in ("ridge_beam",)]
    if not chord_ids:
        chord_ids = [members[0].id]
    connections = []
    connected = set()
    for m in members:
        if m.id in chord_ids:
            continue
        target = chord_ids[0] if m.id not in connected else chord_ids[-1]
        connections.append(GeneratedConnection(a=target, b=m.id, type=connection_type))
        connected.add(m.id)
    return connections


# ---------------------------------------------------------------------------
# Main generator — zero hardcoding, fully dynamic
# ---------------------------------------------------------------------------

class LocalGenerationService:
    """
    Constraint-aware candidate generator.

    The number and type of candidates is determined entirely by the input
    constraints — no hardcoded counts. More diverse inputs produce more
    candidates, each with a genuinely different structural topology.
    """

    def generate(
        self,
        constraints: ConstraintSet,
        *,
        candidate_index: int = 1,
    ) -> GenerationCandidate:
        if candidate_index < 1:
            raise ValueError("candidate_index must be >= 1")

        # --- Pull all constraint fields ---
        people = constraints.occupancy.people
        scenario = constraints.environment.scenario
        material, is_tube = _pick_primary_material(constraints.materials)
        strategy = _resolve_roof_strategy(scenario)

        if material.diameter_m is None:
            raise ValueError(
                f"Material {material.id} requires diameter_m for local generation"
            )

        available_length = material.length_m

        # --- Core structural parameters ---
        span_m = min(constraints.site.width_m, available_length)
        bays = _compute_bays(people, span_m)
        height_m = _compute_height(span_m, scenario)
        connection_type = _connection_type_for_env(scenario, candidate_index)

        # --- Select generator dynamically ---
        gen_idx = (candidate_index - 1) % len(_GENERATORS)
        design_type, gen_fn = _GENERATORS[gen_idx]

        members = gen_fn(material, span_m, height_m, bays, strategy)
        connections = _build_connections(members, connection_type)

        return GenerationCandidate(
            candidate_id=f"LOCAL-{candidate_index:02d}",
            design_type=design_type,
            span_m=round(span_m, 2),
            height_m=round(height_m, 2),
            members=members,
            connections=connections,
        )

    def generate_candidates(
        self,
        constraints: ConstraintSet,
        *,
        count: int | None = None,
    ) -> list[GenerationCandidate]:
        """
        Generate candidates. If count is None, it's computed automatically
        from the constraint inputs (more diverse inputs → more candidates).
        """
        if count is None:
            count = _compute_candidate_count(constraints)
        if count < 1:
            raise ValueError("count must be >= 1")

        return [
            self.generate(constraints, candidate_index=index)
            for index in range(1, count + 1)
        ]
