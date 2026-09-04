-- Richer, honest physique-scan coaching: store what looks good, what's lagging,
-- a concrete action plan, and a comparison note vs the previous scan.
alter table body_scans
  add column if not exists strengths text[] default '{}',
  add column if not exists weak_points text[] default '{}',
  add column if not exists action_plan text[] default '{}',
  add column if not exists since_last text;
