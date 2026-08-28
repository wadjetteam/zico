-- PostgreSQL production migration for the Risk Treatment module.
-- Controls are selected manually from the stored ISO/IEC 27002 library; no AI/RAG source is permitted.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE risk_treatment_strategy AS ENUM ('MODIFY', 'RETAIN', 'AVOID', 'SHARE');
CREATE TYPE risk_treatment_status AS ENUM ('DRAFT', 'PROPOSED', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'OVERDUE');
CREATE TYPE treatment_workflow_status AS ENUM ('draft', 'submitted', 'approved', 'in_progress', 'completed', 'rejected', 'overdue');
CREATE TYPE treatment_control_source AS ENUM ('MANUAL');
CREATE TYPE treatment_control_implementation_status AS ENUM ('PLANNED', 'IN_PROGRESS', 'ACTIVE');

CREATE TABLE risk_treatments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  risk_id UUID NOT NULL REFERENCES risks(id) ON DELETE CASCADE,
  strategy risk_treatment_strategy NOT NULL,
  justification TEXT NOT NULL CHECK (length(trim(justification)) > 0),
  residual_likelihood SMALLINT NOT NULL CHECK (residual_likelihood BETWEEN 1 AND 5),
  residual_impact SMALLINT NOT NULL CHECK (residual_impact BETWEEN 1 AND 5),
  residual_score SMALLINT GENERATED ALWAYS AS (residual_likelihood * residual_impact) STORED,
  status risk_treatment_status NOT NULL DEFAULT 'DRAFT',
  workflow_status treatment_workflow_status NOT NULL DEFAULT 'draft',
  overdue_flag BOOLEAN NOT NULL DEFAULT FALSE,
  owner_id UUID NOT NULL REFERENCES users(id),
  target_date DATE,
  allocated_budget NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (allocated_budget >= 0),
  progress_percentage SMALLINT NOT NULL DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
  vendor_id UUID NULL REFERENCES third_parties(id),
  attachment_name TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE treatment_controls (
  treatment_id UUID NOT NULL REFERENCES risk_treatments(id) ON DELETE CASCADE,
  control_id UUID NOT NULL REFERENCES controls(id),
  source treatment_control_source NOT NULL DEFAULT 'MANUAL',
  implementation_status treatment_control_implementation_status NOT NULL DEFAULT 'PLANNED',
  PRIMARY KEY (treatment_id, control_id)
);

CREATE INDEX idx_risk_treatments_risk_id ON risk_treatments(risk_id);
CREATE INDEX idx_risk_treatments_deadline ON risk_treatments(target_date) WHERE status NOT IN ('COMPLETED', 'REJECTED');
