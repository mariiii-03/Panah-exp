/**
 * PANAGAH API Client — Strongly typed service connecting to FastAPI endpoints
 */

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api/v1';

export interface Project {
  id: number;
  name: string;
  location: string;
  status: 'draft' | 'in_progress' | 'review' | 'certified' | string;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  total_projects: number;
  active_projects: number;
  total_sites: number;
  total_materials: number;
  total_candidates: number;
  total_generated_designs: number;
  total_design_versions: number;
  total_validation_runs: number;
  total_reviews: number;
  total_audit_events: number;
  recent_activity: Array<{
    id: number;
    action: string;
    object_type: string;
    object_id: string;
    created_at: string;
  }>;
}

export interface ProjectHistoryItem {
  id: number;
  name: string;
  location: string;
  status: string;
  created_at: string;
  updated_at: string;
  site_count: number;
  material_count: number;
  candidate_count: number;
  generated_count: number;
  design_version_count: number;
}

export interface WindLoadRequest {
  mean_roof_height_m: number;
  plan_length_m: number;
  plan_width_m: number;
  roof_slope_deg?: number;
  basic_wind_speed_m_s?: number;
  region?: string;
  exposure_category?: string;
}

export interface WindLoadResponse {
  velocity_pressure_pa: number;
  velocity_pressure_kpa: number;
  max_positive_pressure_pa: number;
  max_negative_pressure_pa: number;
  governing_pressure_pa: number;
  governing_pressure_kpa: number;
  governing_zone: string;
  governing_case: string;
  // Legacy aliases kept for backward compat with BuildPage display
  max_uplift_pressure_pa?: number;   // not returned by backend — computed below in BuildPage
  total_uplift_force_n?: number;     // not returned by backend
  total_lateral_force_n?: number;    // not returned by backend
  zones?: Array<{ zone_id: string; zone_name: string; surface: string; positive_pa: number; negative_pa: number; net_pa: number }>;
  safety_assessment?: { is_wind_resistant: boolean; safety_margin: number; assessment: string };
}

export interface SeismicLoadRequest {
  total_height_m: number;
  number_of_stories?: number;
  structural_system?: string;
  region?: string;
  plan_length_m?: number;
  plan_width_m?: number;
}

// Actual backend response shape — results are nested under 'results'
export interface SeismicLoadResponse {
  parameters: {
    zone_factor_z: number;
    spectral_acceleration_ss: number;
    spectral_acceleration_s1: number;
    design_sds: number;
    design_sd1: number;
    response_modification_r: number;
    fundamental_period_s: number;
    seismic_response_coefficient_cs: number;
  };
  results: {
    total_weight_kn: number;
    base_shear_kn: number;
    base_shear_coefficient: number;
    max_lateral_force_kn: number;
    max_overturning_moment_knm: number;
  };
  story_forces?: Array<{ story: number; height_m: number; weight_kn: number; lateral_force_kn: number }>;
  safety_assessment?: { is_seismically_designed: boolean; safety_margin: number; assessment: string };
}

export interface MaterialItem {
  type: string;
  display_name: string;
  category: string;
  locally_sourced: boolean;
  density_kg_m3: number;
  elastic_modulus_pa: number;
  allowable_bending_stress_pa: number;
  allowable_axial_stress_pa: number;
  expected_lifespan_years: number;
  source: string;
}

// Actual backend shape from /api/v1/standards/rules
export interface StandardRule {
  rule_id: string;
  category: string;
  title: string;
  description: string;
  severity: string;
  requirement: string;
  source: string;
  section: string;
  verification_source: string;
  // Legacy optional fields (not returned by current backend)
  check_type?: string;
  threshold?: number;
  unit?: string;
}

export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch(`${API_BASE}/projects`);
  if (!res.ok) throw new Error('Failed to load projects');
  return res.json();
}

export async function createProject(payload: { name: string; location: string }): Promise<Project> {
  const res = await fetch(`${API_BASE}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to create project');
  }
  return res.json();
}

export async function deleteProject(projectId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/projects/${projectId}`, {
    method: 'DELETE',
  });
  if (!res.ok && res.status !== 204 && res.status !== 404) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to delete project');
  }
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await fetch(`${API_BASE}/dashboard/stats`);
  if (!res.ok) throw new Error('Failed to load dashboard stats');
  return res.json();
}

export async function fetchProjectsHistory(): Promise<ProjectHistoryItem[]> {
  const res = await fetch(`${API_BASE}/projects-history`);
  if (!res.ok) throw new Error('Failed to load projects history');
  const data = await res.json();
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.projects)) return data.projects;
  return [];
}

export async function fetchMaterialCatalog(category?: string): Promise<MaterialItem[]> {
  const url = category
    ? `${API_BASE}/material-catalog?category=${encodeURIComponent(category)}`
    : `${API_BASE}/material-catalog`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load material catalog');
  return res.json();
}

export async function calculateWind(payload: WindLoadRequest): Promise<WindLoadResponse> {
  const res = await fetch(`${API_BASE}/engineering/wind-load`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to calculate wind loads');
  return res.json();
}

export async function calculateSeismic(payload: SeismicLoadRequest): Promise<SeismicLoadResponse> {
  const res = await fetch(`${API_BASE}/engineering/seismic-load`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to calculate seismic loads');
  return res.json();
}

export async function calculateCostEstimate(payload: {
  materials: Array<{ material_id: string; quantity: number; unit_cost_usd?: number }>;
  region?: string;
  shelter_type?: string;
  transport_km?: number;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/engineering/cost-estimate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to calculate cost estimation');
  return res.json();
}

export async function fetchStandardsRules(category?: string): Promise<{ rules: StandardRule[] }> {
  const url = category ? `${API_BASE}/standards/rules?category=${encodeURIComponent(category)}` : `${API_BASE}/standards/rules`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to load standards rules');
  return res.json();
}

export async function fetchStandardsCategories(): Promise<{ categories: Array<{ category: string; count: number }> }> {
  const res = await fetch(`${API_BASE}/standards/categories`);
  if (!res.ok) throw new Error('Failed to load standards categories');
  return res.json();
}

export async function downloadReportPdf(payload: { project_name: string; designer?: string }): Promise<Blob> {
  const res = await fetch(`${API_BASE}/engineering/generate-report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to generate report PDF');
  return res.blob();
}
