-- Governance extensions: workflow state is distinct from escalation and overdue indicators.

ALTER TABLE risk_treatments
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS decided_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS decided_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS decision_comment TEXT,
  ADD COLUMN IF NOT EXISTS overdue BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS overdue_flag BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS overdue_since TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS escalation_stage TEXT NOT NULL DEFAULT 'initial',
  ADD COLUMN IF NOT EXISTS reminder_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_reminder_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS acknowledged_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS notification_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS closed_monitoring_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS monitoring_approved_by UUID REFERENCES users(id);

CREATE TABLE treatment_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_id UUID NOT NULL REFERENCES risk_treatments(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES users(id),
  target_date DATE NOT NULL,
  dependency TEXT,
  budget NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (budget >= 0),
  status treatment_control_implementation_status NOT NULL DEFAULT 'PLANNED',
  progress_percentage SMALLINT NOT NULL DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE treatment_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_id UUID NOT NULL REFERENCES risk_treatments(id) ON DELETE CASCADE,
  evidence_type TEXT NOT NULL,
  name TEXT NOT NULL,
  immutable_reference TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE treatment_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_id UUID NOT NULL REFERENCES risk_treatments(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  actor_id UUID NOT NULL REFERENCES users(id),
  actor_role TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_treatment_actions_due ON treatment_actions(target_date, status);
CREATE INDEX idx_treatment_audit_events_treatment ON treatment_audit_events(treatment_id, occurred_at DESC);
