# Panah (پناگاہ) — Humanitarian Shelter Assessment & Parametric Design Platform

> **Constraint-driven generative design and deterministic structural assessment for rapid emergency shelters.**

A production-grade, full-stack application connecting a **FastAPI** engineering backend with a **React + Vite + TypeScript** frontend inspired by bespoke architectural specifications (Space Grotesk typography, IBM Plex Mono telemetry, and a Sage/Navy/Lime design system).

---

## Architecture Overview

```
Panah-exp/
├── frontend/             # React + Vite + TypeScript web application (Port 5173)
│   ├── src/
│   │   ├── components/   # Navbar, ProfileDropdown, ShelterCanvas3D (Three.js WebGL)
│   │   ├── pages/        # Home, Build, Cost Estimation, History, Standards, Settings
│   │   ├── services/     # Typed API client connected to /api/v1/*
│   │   └── styles/       # Central design tokens & CSS system
│   └── vite.config.ts    # Configured with proxy to FastAPI (port 8000)
│
├── Backend/              # FastAPI Python backend (Port 8000)
│   ├── app/
│   │   ├── api/          # 30+ endpoints (projects, engineering, BOM, standards, etc.)
│   │   ├── engineering/  # ASCE 7-22 wind load, ELF seismic load, Pareto optimization
│   │   ├── validator/    # Deterministic Sphere Handbook YAML rule validation engine
│   │   ├── geometry/     # Parametric 3D truss builder & glTF/IFC export
│   │   └── storage/      # Local media and upload storage with path traversal protection
│   ├── seed_data.py      # Seeds realistic humanitarian shelter projects & materials
│   └── tests/            # 37 test suites (586 passing tests)
│
└── Designs/              # Original reference HTML/CSS mockups
```

---

## Key Features

1. **Portfolio & Assessment Dashboard (`/`)**:
   - Real-time telemetry: Total projects, evaluated sites, material profiles, and Sphere standards.
   - Project cards displaying live wind resistance benchmarks, seismic zone classifications, and unit costs.
   - Interactive project creator linking directly to the backend database.

2. **Parametric 3D Design Engine (`/build`)**:
   - **Interactive WebGL 3D Viewer**: Built with Three.js rendering king post trusses, columns, rafters, ridge beams, and foundation plinths in real-time as dimensions change.
   - **Live Engineering Telemetry**: Calls backend ASCE 7-22 wind load equations and ELF seismic base shear calculators on every parameter adjustment.
   - **Sphere Compliance Prescreening**: Deterministic verification of minimum covered living area ($\ge 3.5\,\text{m}^2/\text{person}$), headroom ($\ge 2.0\,\text{m}$), and monsoon pitch ($\ge 15^\circ$).
   - **PDF Engineering Report Export**: Generates professional engineering documentation directly from the backend.

3. **Cost Estimation & Bill of Materials (`/cost-estimation`)**:
   - Interactive Bill of Materials matrix with unit pricing and local bazaar vs. depot sourcing tags.
   - Real-time USD ($) and PKR (₨) currency conversion.
   - Dynamic expenditure breakdown (Materials, Labor, Logistics, and 10% Contingency).
   - Program scale slider (1 to 500 units) with bulk volume discounts and CSV export.

4. **Audit Trail & Project History (`/history`)**:
   - Searchable, filterable ledger of all registered projects, field sites, and material inventories.
   - Track design versions (v1.0, v1.2), review statuses, and download past assessment reports.

5. **Humanitarian Guidelines & Standards (`/guideline`)**:
   - Live catalog of Sphere Handbook 2018 and structural standards.
   - Interactive category browser and parametric architectural blueprint callouts.

6. **System Preferences (`/settings`)**:
   - Configure measurement units (Metric SI vs. Imperial), default financial currencies, and regional hazard presets.
   - API key management for automated field sensor and drone data ingestion.

---

## Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18+) and **npm**
- **Python** (3.11+)

### 2. Backend Setup
```bash
cd Backend

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate    # On Windows: .venv\Scripts\activate

# Install requirements
pip install -r requirements.txt

# Seed demonstration shelter projects
python seed_data.py

# Launch FastAPI server
python run.py --port 8000
```
- **API Base**: `http://127.0.0.1:8000`
- **Swagger Docs**: `http://127.0.0.1:8000/docs`
- **Health Check**: `http://127.0.0.1:8000/health`

### 3. Frontend Setup
```bash
cd frontend

# Install npm dependencies
npm install

# Start development server
npm run dev
```
- **Web Application**: `http://127.0.0.1:5173`

---

## Running Automated Tests

```bash
# Run all 586 backend engineering & API tests
cd Backend
PYTHONPATH=. .venv/bin/python -m pytest tests/ -q

# Run frontend TypeScript type-check and production build
cd frontend
npm run build
```