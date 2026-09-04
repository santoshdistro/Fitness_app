-- The Apple Watch measures a lot more than steps and calories, and the metrics
-- below are the ones that describe the BODY rather than the behaviour: they move
-- with recovery, training load and fitness, not with how much you walked.
--
-- All are daily values read from HealthKit by the sync Shortcut, so they live on
-- daily_logs alongside steps and sleep. Run once in the Supabase SQL Editor.
--
--   resting_hr           bpm. Trends down as fitness improves and spikes when
--                        you are under-recovered, ill, or drinking.
--   hrv_ms               SDNN in milliseconds. The readiness signal — high is
--                        recovered, a sustained drop means accumulated stress.
--   vo2_max              ml/kg/min ("Cardio Fitness"). The headline running
--                        number; moves over 6-8 weeks, not day to day.
--   respiratory_rate     breaths/min during sleep. Stable per person, so a rise
--                        is usually illness or alcohol.
--   wrist_temp_delta     °C deviation from your own baseline (Series 8+). Signed,
--                        so it needs a numeric type that allows negatives.
alter table public.daily_logs
  add column if not exists resting_hr integer,
  add column if not exists hrv_ms integer,
  add column if not exists vo2_max numeric(4, 1),
  add column if not exists respiratory_rate numeric(4, 1),
  add column if not exists wrist_temp_delta numeric(3, 1);
