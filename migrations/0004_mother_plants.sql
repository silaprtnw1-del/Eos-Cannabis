-- Adds mother-plant lineage tracking + clone success-rate visibility.
-- plants.archivereason lets the archive flow distinguish a failed clone
-- from routine archiving (post-harvest, corrections, etc.) so success
-- rate can be computed per mother without guessing at intent.

CREATE TYPE mother_status AS ENUM ('ACTIVE', 'QUARANTINE', 'CULLED');

CREATE TABLE public.mother_plants (
  id text PRIMARY KEY,
  strainname text NOT NULL,
  roomname text NOT NULL,
  status mother_status NOT NULL DEFAULT 'ACTIVE',
  acquiredat timestamptz NOT NULL DEFAULT now(),
  notes text,
  createdat timestamptz NOT NULL DEFAULT now(),
  updatedat timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.plants
  ADD COLUMN motherid text REFERENCES public.mother_plants(id) ON DELETE SET NULL,
  ADD COLUMN archivereason text;

ALTER TABLE public.mother_plants ENABLE ROW LEVEL SECURITY;

CREATE POLICY mother_plants_select_authenticated ON public.mother_plants
  FOR SELECT TO authenticated
  USING (true);

-- current_user_role() already defined in 0002_role_based_rls.sql
CREATE POLICY mother_plants_insert_supervisor_above ON public.mother_plants
  FOR INSERT TO authenticated
  WITH CHECK (public.current_user_role() IN ('SUPERVISOR', 'ADMIN'));
