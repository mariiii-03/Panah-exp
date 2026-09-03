"""
Cost Analysis Engine — Market, Efficiency & Scale for Humanitarian Shelters

Extends the base cost_estimation.py with:
  1. Local market cost analysis — supplier comparison, price ranges, cheapest source
  2. Efficiency analysis — graph-ready data for pie charts, bar charts, cost curves
  3. Deployment scale analysis — bulk discounts, economies of scale, multi-unit costs

All functions return dicts ready for JSON serialization and frontend chart rendering.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Any

from app.materials.catalog import MATERIAL_CATALOG
from app.engineering.cost_estimation import (
    LABOR_RATES_BY_REGION,
    CONSTRUCTION_HOURS,
    TRANSPORT_COST_PER_KM,
    WASTE_FACTOR,
    CONTINGENCY_RATE,
    estimate_cost,
)


# ---------------------------------------------------------------------------
# 1. LOCAL MARKET COST ANALYSIS
# ---------------------------------------------------------------------------

# Simulated local suppliers with regional price variations
# In production, this would come from a database or API
_LOCAL_SUPPLIERS: dict[str, list[dict[str, Any]]] = {
    "south_asia": [
        {"name": "Local Bamboo Market", "type": "treated_bamboo", "unit_cost_usd": 3.00, "rating": 4.2, "distance_km": 3, "lead_time_days": 1, "bulk_discount_pct": 10, "min_bulk_qty": 50},
        {"name": "Timber Depot Lahore", "type": "reclaimed_timber", "unit_cost_usd": 4.50, "rating": 4.5, "distance_km": 12, "lead_time_days": 2, "bulk_discount_pct": 8, "min_bulk_qty": 30},
        {"name": "Brick Kiln Network", "type": "stabilized_mud_brick", "unit_cost_usd": 0.65, "rating": 3.8, "distance_km": 8, "lead_time_days": 3, "bulk_discount_pct": 15, "min_bulk_qty": 500},
        {"name": "Steel Hardware Store", "type": "steel_connector", "unit_cost_usd": 1.80, "rating": 4.0, "distance_km": 15, "lead_time_days": 5, "bulk_discount_pct": 5, "min_bulk_qty": 100},
        {"name": "Roofing Solutions PK", "type": "corrugated_tin", "unit_cost_usd": 10.50, "rating": 4.3, "distance_km": 20, "lead_time_days": 4, "bulk_discount_pct": 12, "min_bulk_qty": 20},
    ],
    "east_africa": [
        {"name": "Nairobi Bamboo Co-op", "type": "treated_bamboo", "unit_cost_usd": 2.80, "rating": 4.0, "distance_km": 5, "lead_time_days": 2, "bulk_discount_pct": 12, "min_bulk_qty": 40},
        {"name": "Timber yard Mombasa", "type": "reclaimed_timber", "unit_cost_usd": 4.00, "rating": 3.9, "distance_km": 25, "lead_time_days": 3, "bulk_discount_pct": 7, "min_bulk_qty": 25},
        {"name": "Local Brick Works", "type": "stabilized_mud_brick", "unit_cost_usd": 0.55, "rating": 4.1, "distance_km": 6, "lead_time_days": 2, "bulk_discount_pct": 18, "min_bulk_qty": 400},
        {"name": "Hardware Hub Kampala", "type": "steel_connector", "unit_cost_usd": 1.60, "rating": 3.7, "distance_km": 18, "lead_time_days": 7, "bulk_discount_pct": 6, "min_bulk_qty": 80},
    ],
    "default": [
        {"name": "General Materials Store", "type": "treated_bamboo", "unit_cost_usd": 3.50, "rating": 3.5, "distance_km": 10, "lead_time_days": 2, "bulk_discount_pct": 8, "min_bulk_qty": 30},
        {"name": "Timber Supply Co", "type": "reclaimed_timber", "unit_cost_usd": 5.00, "rating": 4.0, "distance_km": 15, "lead_time_days": 3, "bulk_discount_pct": 5, "min_bulk_qty": 20},
        {"name": "Brick & Block Ltd", "type": "stabilized_mud_brick", "unit_cost_usd": 0.80, "rating": 3.8, "distance_km": 10, "lead_time_days": 4, "bulk_discount_pct": 10, "min_bulk_qty": 300},
    ],
}


@dataclass
class SupplierQuote:
    """A price quote from a local supplier for a material."""
    supplier_name: str
    material_type: str
    unit_cost_usd: float
    catalog_price_usd: float
    savings_pct: float
    rating: float
    distance_km: int
    lead_time_days: int
    bulk_discount_pct: float
    min_bulk_qty: int
    is_cheapest: bool
    total_for_qty_usd: float  # cost for requested quantity (with bulk discount if applicable)

    def to_dict(self) -> dict[str, Any]:
        return {
            "supplier_name": self.supplier_name,
            "material_type": self.material_type,
            "unit_cost_usd": round(self.unit_cost_usd, 2),
            "catalog_price_usd": round(self.catalog_price_usd, 2),
            "savings_pct": round(self.savings_pct, 1),
            "rating": self.rating,
            "distance_km": self.distance_km,
            "lead_time_days": self.lead_time_days,
            "bulk_discount_pct": self.bulk_discount_pct,
            "min_bulk_qty": self.min_bulk_qty,
            "is_cheapest": self.is_cheapest,
            "total_for_qty_usd": round(self.total_for_qty_usd, 2),
        }


@dataclass
class MarketAnalysisResult:
    """Complete local market cost analysis."""
    region: str
    material_quotes: dict[str, list[SupplierQuote]]  # material_type → sorted quotes
    cheapest_sources: dict[str, SupplierQuote]  # material_type → cheapest quote
    total_catalog_cost_usd: float
    total_local_cost_usd: float
    total_savings_usd: float
    total_savings_pct: float
    recommendations: list[str]

    def to_dict(self) -> dict[str, Any]:
        return {
            "region": self.region,
            "material_quotes": {
                mat: [q.to_dict() for q in quotes]
                for mat, quotes in self.material_quotes.items()
            },
            "cheapest_sources": {
                mat: q.to_dict() for mat, q in self.cheapest_sources.items()
            },
            "total_catalog_cost_usd": round(self.total_catalog_cost_usd, 2),
            "total_local_cost_usd": round(self.total_local_cost_usd, 2),
            "total_savings_usd": round(self.total_savings_usd, 2),
            "total_savings_pct": round(self.total_savings_pct, 1),
            "recommendations": self.recommendations,
        }


def analyze_local_market(
    materials: list[dict[str, Any]],
    region: str = "south_asia",
    quantities: dict[str, int] | None = None,
) -> MarketAnalysisResult:
    """
    Compare material prices across local suppliers for a given region.

    Args:
        materials: List of {type, qty} dicts.
        region: Geographic region to search suppliers.
        quantities: Optional override for quantities per material type.

    Returns:
        MarketAnalysisResult with supplier quotes, cheapest sources, and savings.
    """
    suppliers = _LOCAL_SUPPLIERS.get(region, _LOCAL_SUPPLIERS["default"])
    mat_quotes: dict[str, list[SupplierQuote]] = {}
    cheapest: dict[str, SupplierQuote] = {}
    total_catalog = 0.0
    total_local = 0.0
    recommendations = []

    for mat in materials:
        mat_type = mat.get("type", "unknown")
        qty = (quantities or {}).get(mat_type, mat.get("qty", 1))
        cat = MATERIAL_CATALOG.get(mat_type)
        catalog_price = cat.unit_cost_usd if cat else 0.0

        # Find all suppliers for this material type
        matching = [s for s in suppliers if s["type"] == mat_type]
        if not matching:
            # Use catalog price as fallback
            matching = [{"name": "Catalog Reference", "type": mat_type,
                         "unit_cost_usd": catalog_price, "rating": 0, "distance_km": 0,
                         "lead_time_days": 0, "bulk_discount_pct": 0, "min_bulk_qty": 999999}]

        quotes = []
        for s in matching:
            unit_cost = s["unit_cost_usd"]
            # Apply bulk discount if quantity qualifies
            if qty >= s.get("min_bulk_qty", 999999):
                discounted = unit_cost * (1 - s["bulk_discount_pct"] / 100)
            else:
                discounted = unit_cost

            total_for_qty = discounted * qty
            savings = ((catalog_price - discounted) / catalog_price * 100) if catalog_price > 0 else 0

            quotes.append(SupplierQuote(
                supplier_name=s["name"],
                material_type=mat_type,
                unit_cost_usd=discounted,
                catalog_price_usd=catalog_price,
                savings_pct=max(0, savings),
                rating=s.get("rating", 0),
                distance_km=s.get("distance_km", 0),
                lead_time_days=s.get("lead_time_days", 0),
                bulk_discount_pct=s.get("bulk_discount_pct", 0),
                min_bulk_qty=s.get("min_bulk_qty", 0),
                is_cheapest=False,
                total_for_qty_usd=total_for_qty,
            ))

        # Sort by total cost
        quotes.sort(key=lambda q: q.total_for_qty_usd)
        if quotes:
            quotes[0].is_cheapest = True
            cheapest[mat_type] = quotes[0]

        mat_quotes[mat_type] = quotes
        total_catalog += catalog_price * qty
        total_local += quotes[0].total_for_qty_usd if quotes else catalog_price * qty

    # Generate recommendations
    total_savings = total_catalog - total_local
    total_savings_pct = (total_savings / total_catalog * 100) if total_catalog > 0 else 0

    if total_savings > 0:
        recommendations.append(
            f"Switch to local suppliers to save ${total_savings:.2f} ({total_savings_pct:.1f}% off catalog prices)"
        )

    for mat_type, q in cheapest.items():
        if q.distance_km > 15:
            recommendations.append(
                f"Consider closer alternative for {mat_type} — {q.supplier_name} is {q.distance_km}km away"
            )
        if q.lead_time_days > 5:
            recommendations.append(
                f"{mat_type} from {q.supplier_name} has {q.lead_time_days}-day lead time — plan ahead"
            )

    if not recommendations:
        recommendations.append("Current pricing looks competitive — no immediate action needed")

    return MarketAnalysisResult(
        region=region,
        material_quotes=mat_quotes,
        cheapest_sources=cheapest,
        total_catalog_cost_usd=total_catalog,
        total_local_cost_usd=total_local,
        total_savings_usd=total_savings,
        total_savings_pct=total_savings_pct,
        recommendations=recommendations,
    )


# ---------------------------------------------------------------------------
# 2. EFFICIENCY ANALYSIS — Graph-Ready Data
# ---------------------------------------------------------------------------

@dataclass
class EfficiencyAnalysisResult:
    """Graph-ready data for cost efficiency visualization."""
    # Pie chart: cost breakdown by category
    cost_breakdown_pie: list[dict[str, Any]]  # [{label, value, color}]
    # Bar chart: cost comparison across shelter types
    shelter_type_comparison: list[dict[str, Any]]  # [{type, total, material, labor, transport}]
    # Line chart: cost vs occupancy
    cost_vs_occupancy: list[dict[str, Any]]  # [{occupancy, total, cost_per_person}]
    # Bar chart: cost by region
    cost_by_region: list[dict[str, Any]]  # [{region, total, labor_pct}]
    # Efficiency metrics
    efficiency_score: float  # 0-100 composite score
    efficiency_rating: str  # "Excellent", "Good", "Fair", "Poor"
    benchmarks: dict[str, Any]  # comparison against industry benchmarks

    def to_dict(self) -> dict[str, Any]:
        return {
            "cost_breakdown_pie": self.cost_breakdown_pie,
            "shelter_type_comparison": self.shelter_type_comparison,
            "cost_vs_occupancy": self.cost_vs_occupancy,
            "cost_by_region": self.cost_by_region,
            "efficiency_score": round(self.efficiency_score, 1),
            "efficiency_rating": self.efficiency_rating,
            "benchmarks": self.benchmarks,
        }


def analyze_efficiency(
    materials: list[dict[str, Any]],
    region: str = "south_asia",
    shelter_type: str = "bamboo_truss",
    occupancy: int = 5,
    floor_area_m2: float = 20.0,
    transport_distance_km: float = 10.0,
) -> EfficiencyAnalysisResult:
    """
    Generate graph-ready efficiency analysis data.

    Produces data structures ready for chart.js / recharts / d3 rendering.
    """
    # --- Get base cost estimate ---
    base = estimate_cost(
        materials=materials, region=region, shelter_type=shelter_type,
        occupancy=occupancy, floor_area_m2=floor_area_m2,
        transport_distance_km=transport_distance_km,
    )

    # --- Pie chart: cost breakdown ---
    summary = base.summary
    pie_colors = {
        "Materials": "#4CAF50",
        "Labor": "#2196F3",
        "Transport": "#FF9800",
        "Equipment": "#9C27B0",
        "Waste & Contingency": "#F44336",
    }
    cost_breakdown_pie = [
        {"label": "Materials", "value": round(summary.material_cost_usd, 2), "color": pie_colors["Materials"]},
        {"label": "Labor", "value": round(summary.labor_cost_usd, 2), "color": pie_colors["Labor"]},
        {"label": "Transport", "value": round(summary.transport_cost_usd, 2), "color": pie_colors["Transport"]},
        {"label": "Equipment", "value": round(summary.equipment_cost_usd, 2), "color": pie_colors["Equipment"]},
        {"label": "Waste & Contingency", "value": round(summary.waste_cost_usd + summary.contingency_cost_usd, 2), "color": pie_colors["Waste & Contingency"]},
    ]

    # --- Bar chart: shelter type comparison ---
    shelter_types = ["basic_tent", "bamboo_truss", "timber_frame", "mud_brick", "composite"]
    shelter_type_comparison = []
    for st in shelter_types:
        est = estimate_cost(
            materials=materials, region=region, shelter_type=st,
            occupancy=occupancy, floor_area_m2=floor_area_m2,
            transport_distance_km=transport_distance_km,
        )
        shelter_type_comparison.append({
            "type": st.replace("_", " ").title(),
            "total": round(est.summary.total_cost_usd, 2),
            "material": round(est.summary.material_cost_usd, 2),
            "labor": round(est.summary.labor_cost_usd, 2),
            "transport": round(est.summary.transport_cost_usd, 2),
        })

    # --- Line chart: cost vs occupancy ---
    cost_vs_occupancy = []
    for occ in range(1, 26):
        est = estimate_cost(
            materials=materials, region=region, shelter_type=shelter_type,
            occupancy=occ, floor_area_m2=max(occ * 3.5, floor_area_m2),
            transport_distance_km=transport_distance_km,
        )
        cost_vs_occupancy.append({
            "occupancy": occ,
            "total": round(est.summary.total_cost_usd, 2),
            "cost_per_person": round(est.summary.cost_per_person_usd, 2),
        })

    # --- Bar chart: cost by region ---
    regions = list(LABOR_RATES_BY_REGION.keys())
    cost_by_region = []
    for reg in regions:
        if reg == "default":
            continue
        est = estimate_cost(
            materials=materials, region=reg, shelter_type=shelter_type,
            occupancy=occupancy, floor_area_m2=floor_area_m2,
            transport_distance_km=transport_distance_km,
        )
        labor_pct = (est.summary.labor_cost_usd / est.summary.total_cost_usd * 100) if est.summary.total_cost_usd > 0 else 0
        cost_by_region.append({
            "region": reg.replace("_", " ").title(),
            "total": round(est.summary.total_cost_usd, 2),
            "labor_pct": round(labor_pct, 1),
        })

    # --- Efficiency score ---
    # Composite: lower cost/m2 + lower cost/person + smaller transport footprint = higher score
    cost_per_m2_score = max(0, 100 - (summary.cost_per_m2_usd / 5))  # $5/m² = 0 score
    cost_per_person_score = max(0, 100 - (summary.cost_per_person_usd / 10))  # $10/person = 0 score
    transport_score = max(0, 100 - (transport_distance_km * 2))  # 50km = 0 score
    material_efficiency = max(0, 100 - (summary.waste_cost_usd / max(summary.material_cost_usd, 0.01) * 1000))

    efficiency_score = (cost_per_m2_score * 0.3 + cost_per_person_score * 0.3 +
                        transport_score * 0.2 + material_efficiency * 0.2)
    efficiency_score = max(0, min(100, efficiency_score))

    if efficiency_score >= 80:
        rating = "Excellent"
    elif efficiency_score >= 60:
        rating = "Good"
    elif efficiency_score >= 40:
        rating = "Fair"
    else:
        rating = "Poor"

    benchmarks = {
        "sphere_handbook_target_usd_per_person": 50,
        "current_cost_per_person_usd": round(summary.cost_per_person_usd, 2),
        "meets_sphere_target": summary.cost_per_person_usd <= 50,
        "industry_avg_cost_per_m2_usd": 85.0,
        "current_cost_per_m2_usd": round(summary.cost_per_m2_usd, 2),
        "below_industry_avg": summary.cost_per_m2_usd <= 85.0,
    }

    return EfficiencyAnalysisResult(
        cost_breakdown_pie=cost_breakdown_pie,
        shelter_type_comparison=shelter_type_comparison,
        cost_vs_occupancy=cost_vs_occupancy,
        cost_by_region=cost_by_region,
        efficiency_score=efficiency_score,
        efficiency_rating=rating,
        benchmarks=benchmarks,
    )


# ---------------------------------------------------------------------------
# 3. DEPLOYMENT SCALE ANALYSIS
# ---------------------------------------------------------------------------

# Bulk discount tiers (cumulative quantity → discount %)
_BULK_DISCOUNT_TIERS = [
    (1, 0.0),        # 1 unit: no discount
    (5, 3.0),        # 5+ units: 3%
    (10, 7.0),       # 10+ units: 7%
    (25, 12.0),      # 25+ units: 12%
    (50, 18.0),      # 50+ units: 18%
    (100, 25.0),     # 100+ units: 25%
    (250, 30.0),     # 250+ units: 30%
    (500, 35.0),     # 500+ units: 35%
]


def _get_bulk_discount(unit_count: int) -> float:
    """Get applicable bulk discount percentage for a given unit count."""
    discount = 0.0
    for threshold, pct in _BULK_DISCOUNT_TIERS:
        if unit_count >= threshold:
            discount = pct
    return discount


@dataclass
class DeploymentScaleResult:
    """Deployment scale analysis with economies of scale data."""
    # Line chart: cost per unit at different scales
    scale_curve: list[dict[str, Any]]  # [{units, cost_per_unit, total_cost, discount_pct}]
    # Bar chart: cost breakdown at different scales
    scale_breakdown: list[dict[str, Any]]  # [{scale_label, material, labor, transport, other}]
    # Savings analysis
    single_unit_cost: float
    bulk_unit_cost: float
    max_savings_per_unit: float
    max_savings_total: float
    optimal_order_size: int
    optimal_order_total: float
    # Deployment recommendations
    deployment_phases: list[dict[str, Any]]  # [{phase, units, cost_per_unit, total, notes}]
    recommendations: list[str]

    def to_dict(self) -> dict[str, Any]:
        return {
            "scale_curve": self.scale_curve,
            "scale_breakdown": self.scale_breakdown,
            "single_unit_cost": round(self.single_unit_cost, 2),
            "bulk_unit_cost": round(self.bulk_unit_cost, 2),
            "max_savings_per_unit": round(self.max_savings_per_unit, 2),
            "max_savings_total": round(self.max_savings_total, 2),
            "optimal_order_size": self.optimal_order_size,
            "optimal_order_total": round(self.optimal_order_total, 2),
            "deployment_phases": self.deployment_phases,
            "recommendations": self.recommendations,
        }


def analyze_deployment_scale(
    materials: list[dict[str, Any]],
    region: str = "south_asia",
    shelter_type: str = "bamboo_truss",
    occupancy: int = 5,
    floor_area_m2: float = 20.0,
    transport_distance_km: float = 10.0,
    max_units: int = 500,
) -> DeploymentScaleResult:
    """
    Analyze cost at different deployment scales showing economies of scale.

    Shows how cost per unit decreases as deployment规模 increases,
    with bulk material discounts and transport efficiency gains.
    """
    # --- Base single-unit cost ---
    base = estimate_cost(
        materials=materials, region=region, shelter_type=shelter_type,
        occupancy=occupancy, floor_area_m2=floor_area_m2,
        transport_distance_km=transport_distance_km,
    )
    single_unit_cost = base.summary.total_cost_usd

    # --- Scale curve: cost at different unit counts ---
    scale_points = [1, 2, 5, 10, 15, 20, 25, 30, 40, 50, 75, 100, 150, 200, 300, 400, 500]
    scale_points = [u for u in scale_points if u <= max_units]

    scale_curve = []
    scale_breakdown = []
    bulk_unit_cost = single_unit_cost
    optimal_order_size = 1
    optimal_order_total = single_unit_cost

    for units in scale_points:
        discount = _get_bulk_discount(units)
        # Transport efficiency: shared truck = lower per-unit transport
        transport_efficiency = min(1.0, 0.3 + (0.7 / max(1, math.log2(units + 1))))
        # Labor efficiency: team coordination reduces per-unit labor
        labor_efficiency = min(1.0, 0.6 + (0.4 / max(1, math.log2(units + 1))))

        # Recalculate with efficiencies
        material_cost = base.summary.material_cost_usd * (1 - discount / 100)
        labor_cost = base.summary.labor_cost_usd * labor_efficiency
        transport_cost = base.summary.transport_cost_usd * transport_efficiency
        equipment_cost = base.summary.equipment_cost_usd * min(1.0, 0.5 + (0.5 / max(1, units / 10)))
        waste_contingency = (material_cost + labor_cost) * (WASTE_FACTOR + CONTINGENCY_RATE)

        unit_cost = material_cost + labor_cost + transport_cost + equipment_cost + waste_contingency
        total_cost = unit_cost * units

        scale_curve.append({
            "units": units,
            "cost_per_unit": round(unit_cost, 2),
            "total_cost": round(total_cost, 2),
            "discount_pct": round(discount, 1),
            "savings_vs_single": round((single_unit_cost - unit_cost) / single_unit_cost * 100, 1),
        })

        # Track optimal (best value per unit)
        if unit_cost < bulk_unit_cost:
            bulk_unit_cost = unit_cost
            optimal_order_size = units
            optimal_order_total = total_cost

        # Breakdown at key scales
        if units in [1, 10, 50, 100, 500] and units <= max_units:
            scale_breakdown.append({
                "scale_label": f"{units} units",
                "material": round(material_cost * units, 2),
                "labor": round(labor_cost * units, 2),
                "transport": round(transport_cost * units, 2),
                "other": round((equipment_cost + waste_contingency) * units, 2),
            })

    # --- Deployment phases ---
    deployment_phases = []
    phase_defs = [
        ("Phase 1: Pilot", 5, "Test construction process, validate materials, train workers"),
        ("Phase 2: Initial Deployment", 25, "Scale up with trained teams, negotiate bulk prices"),
        ("Phase 3: Full Deployment", 100, "Maximum efficiency, dedicated supply chain"),
        ("Phase 4: Mass Production", 500, "Assembly-line approach, pre-fabricated components"),
    ]

    for label, target_units, notes in phase_defs:
        if target_units > max_units:
            continue
        discount = _get_bulk_discount(target_units)
        transport_eff = min(1.0, 0.3 + (0.7 / max(1, math.log2(target_units + 1))))
        labor_eff = min(1.0, 0.6 + (0.4 / max(1, math.log2(target_units + 1))))

        mat = base.summary.material_cost_usd * (1 - discount / 100)
        lab = base.summary.labor_cost_usd * labor_eff
        trn = base.summary.transport_cost_usd * transport_eff
        eq = base.summary.equipment_cost_usd * min(1.0, 0.5 + (0.5 / max(1, target_units / 10)))
        wc = (mat + lab) * (WASTE_FACTOR + CONTINGENCY_RATE)
        phase_unit = mat + lab + trn + eq + wc

        deployment_phases.append({
            "phase": label,
            "units": target_units,
            "cost_per_unit": round(phase_unit, 2),
            "total": round(phase_unit * target_units, 2),
            "discount_pct": round(discount, 1),
            "notes": notes,
        })

    # --- Recommendations ---
    max_savings_per_unit = single_unit_cost - bulk_unit_cost
    max_savings_total = max_savings_per_unit * optimal_order_size

    recommendations = []
    if optimal_order_size > 1:
        recommendations.append(
            f"Order {optimal_order_size}+ units to get ${max_savings_per_unit:.2f} savings per shelter "
            f"(${max_savings_total:.2f} total)"
        )
    if transport_distance_km > 20:
        recommendations.append(
            "Long transport distance — consider local material sourcing to reduce costs"
        )
    if single_unit_cost > 200:
        recommendations.append(
            "Per-unit cost is high — bulk ordering or material substitution could help"
        )
    if max_units >= 100:
        recommendations.append(
            "At 100+ units, consider pre-fabrication and assembly-line construction"
        )

    return DeploymentScaleResult(
        scale_curve=scale_curve,
        scale_breakdown=scale_breakdown,
        single_unit_cost=single_unit_cost,
        bulk_unit_cost=bulk_unit_cost,
        max_savings_per_unit=max_savings_per_unit,
        max_savings_total=max_savings_total,
        optimal_order_size=optimal_order_size,
        optimal_order_total=optimal_order_total,
        deployment_phases=deployment_phases,
        recommendations=recommendations,
    )
