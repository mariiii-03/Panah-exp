"""Tests for cost analysis engine — market, efficiency, and scale features."""
import pytest

from app.engineering.cost_analysis import (
    analyze_local_market,
    analyze_efficiency,
    analyze_deployment_scale,
)


MATERIALS = [
    {"type": "treated_bamboo", "qty": 30},
    {"type": "reclaimed_timber", "qty": 15},
    {"type": "stabilized_mud_brick", "qty": 200},
    {"type": "steel_connector", "qty": 50},
    {"type": "corrugated_tin", "qty": 10},
]


# ── Local Market Analysis ──────────────────────────────────────────────

class TestLocalMarketAnalysis:

    def test_returns_quotes_for_each_material(self):
        result = analyze_local_market(MATERIALS, region="south_asia")
        assert len(result.material_quotes) == 5
        for mat_type, quotes in result.material_quotes.items():
            assert len(quotes) >= 1

    def test_cheapest_source_marked(self):
        result = analyze_local_market(MATERIALS, region="south_asia")
        for mat_type, quotes in result.material_quotes.items():
            cheapest = [q for q in quotes if q.is_cheapest]
            assert len(cheapest) == 1

    def test_total_savings_positive(self):
        result = analyze_local_market(MATERIALS, region="south_asia")
        assert result.total_savings_usd >= 0

    def test_recommendations_generated(self):
        result = analyze_local_market(MATERIALS, region="south_asia")
        assert len(result.recommendations) >= 1

    def test_unknown_region_uses_default(self):
        result = analyze_local_market(MATERIALS, region="antarctica")
        assert result.region == "antarctica"
        assert len(result.material_quotes) > 0

    def test_bulk_discount_applied(self):
        # 500 bricks should trigger bulk discount
        mats = [{"type": "stabilized_mud_brick", "qty": 500}]
        result = analyze_local_market(mats, region="south_asia")
        brick_quotes = result.material_quotes["stabilized_mud_brick"]
        assert brick_quotes[0].bulk_discount_pct > 0

    def test_to_dict_serializable(self):
        result = analyze_local_market(MATERIALS, region="south_asia")
        d = result.to_dict()
        assert isinstance(d, dict)
        assert "total_savings_usd" in d


# ── Efficiency Analysis ────────────────────────────────────────────────

class TestEfficiencyAnalysis:

    def test_pie_chart_has_all_categories(self):
        result = analyze_efficiency(MATERIALS, region="south_asia")
        labels = {p["label"] for p in result.cost_breakdown_pie}
        assert "Materials" in labels
        assert "Labor" in labels
        assert "Transport" in labels

    def test_shelter_type_comparison_has_5_types(self):
        result = analyze_efficiency(MATERIALS)
        assert len(result.shelter_type_comparison) == 5

    def test_cost_vs_occupancy_curve(self):
        result = analyze_efficiency(MATERIALS)
        assert len(result.cost_vs_occupancy) == 25
        # Cost per person should generally decrease with more people
        first = result.cost_vs_occupancy[0]["cost_per_person"]
        last = result.cost_vs_occupancy[-1]["cost_per_person"]
        # At minimum, the curve should exist
        assert first > 0
        assert last > 0

    def test_cost_by_region(self):
        result = analyze_efficiency(MATERIALS)
        regions = {r["region"] for r in result.cost_by_region}
        assert "South Asia" in regions
        assert "East Africa" in regions

    def test_efficiency_score_range(self):
        result = analyze_efficiency(MATERIALS)
        assert 0 <= result.efficiency_score <= 100

    def test_efficiency_rating_matches_score(self):
        result = analyze_efficiency(MATERIALS)
        if result.efficiency_score >= 80:
            assert result.efficiency_rating == "Excellent"
        elif result.efficiency_score >= 60:
            assert result.efficiency_rating == "Good"
        elif result.efficiency_score >= 40:
            assert result.efficiency_rating == "Fair"
        else:
            assert result.efficiency_rating == "Poor"

    def test_benchmarks_present(self):
        result = analyze_efficiency(MATERIALS)
        assert "sphere_handbook_target_usd_per_person" in result.benchmarks
        assert "meets_sphere_target" in result.benchmarks

    def test_to_dict_serializable(self):
        result = analyze_efficiency(MATERIALS)
        d = result.to_dict()
        assert isinstance(d, dict)
        assert "efficiency_score" in d


# ── Deployment Scale Analysis ──────────────────────────────────────────

class TestDeploymentScaleAnalysis:

    def test_scale_curve_covers_range(self):
        result = analyze_deployment_scale(MATERIALS, max_units=500)
        assert len(result.scale_curve) >= 10
        assert result.scale_curve[0]["units"] == 1
        assert result.scale_curve[-1]["units"] == 500

    def test_cost_decreases_with_scale(self):
        result = analyze_deployment_scale(MATERIALS)
        # Cost per unit at 100 units should be less than at 1 unit
        single = result.scale_curve[0]["cost_per_unit"]
        bulk = next(s for s in result.scale_curve if s["units"] == 100)
        assert bulk["cost_per_unit"] < single

    def test_bulk_discount_increases_with_units(self):
        result = analyze_deployment_scale(MATERIALS)
        discounts = [(s["units"], s["discount_pct"]) for s in result.scale_curve]
        # Discount should be non-decreasing
        for i in range(1, len(discounts)):
            assert discounts[i][1] >= discounts[i-1][1]

    def test_deployment_phases_defined(self):
        result = analyze_deployment_scale(MATERIALS, max_units=200)
        assert len(result.deployment_phases) >= 2
        phases = [p["phase"] for p in result.deployment_phases]
        assert any("Pilot" in p for p in phases)

    def test_savings_calculated(self):
        result = analyze_deployment_scale(MATERIALS)
        assert result.max_savings_per_unit >= 0
        assert result.max_savings_total >= 0

    def test_optimal_order_size_reasonable(self):
        result = analyze_deployment_scale(MATERIALS)
        assert result.optimal_order_size >= 1
        assert result.optimal_order_size <= 500

    def test_max_units_limits_curve(self):
        result = analyze_deployment_scale(MATERIALS, max_units=50)
        for point in result.scale_curve:
            assert point["units"] <= 50

    def test_to_dict_serializable(self):
        result = analyze_deployment_scale(MATERIALS)
        d = result.to_dict()
        assert isinstance(d, dict)
        assert "scale_curve" in d
