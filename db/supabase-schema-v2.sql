-- Creators / Influencer Roster
CREATE TABLE IF NOT EXISTS public.creators (
  id               BIGSERIAL PRIMARY KEY,
  handle           TEXT NOT NULL,
  real_name        TEXT,
  email            TEXT,
  platforms        TEXT[] DEFAULT '{}',
  primary_platform TEXT,
  tier             TEXT NOT NULL DEFAULT 'mid',
  niche            TEXT[] DEFAULT '{}',
  status           TEXT NOT NULL DEFAULT 'prospect',
  subscribers      BIGINT,
  avg_views        BIGINT,
  engagement_rate  DECIMAL(5,2),
  country          TEXT,
  language         TEXT DEFAULT 'English',
  agency           TEXT,
  agency_contact   TEXT,
  rate_card        TEXT,
  affinity_tags    TEXT[] DEFAULT '{}',
  profile_url      TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Campaigns / Activations
CREATE TABLE IF NOT EXISTS public.campaigns (
  id            BIGSERIAL PRIMARY KEY,
  title         TEXT NOT NULL,
  product       TEXT,
  campaign_type TEXT DEFAULT 'launch',
  status        TEXT NOT NULL DEFAULT 'planning',
  brief_url     TEXT,
  budget        DECIMAL(12,2),
  start_date    DATE,
  end_date      DATE,
  notes         TEXT,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.campaign_links (
  id          BIGSERIAL PRIMARY KEY,
  campaign_id BIGINT NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  label       TEXT,
  url         TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Deliverables: one creator x one campaign
CREATE TABLE IF NOT EXISTS public.deliverables (
  id               BIGSERIAL PRIMARY KEY,
  campaign_id      BIGINT NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  creator_id       BIGINT NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
  deliverable_type TEXT DEFAULT 'dedicated_video',
  platform         TEXT,
  status           TEXT NOT NULL DEFAULT 'prospect',
  due_date         DATE,
  publish_date     DATE,
  content_url      TEXT,
  views            BIGINT,
  likes            BIGINT,
  comments         INTEGER,
  payment_amount   DECIMAL(10,2),
  payment_status   TEXT DEFAULT 'pending',
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Contacts
CREATE TABLE IF NOT EXISTS public.contacts (
  id       BIGSERIAL PRIMARY KEY,
  name     TEXT NOT NULL,
  org      TEXT,
  org_type TEXT DEFAULT 'agency',
  role     TEXT,
  email    TEXT,
  notes    TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_creators_status      ON public.creators(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_status     ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_deliverables_camp    ON public.deliverables(campaign_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_creator ON public.deliverables(creator_id);
CREATE INDEX IF NOT EXISTS idx_deliverables_status  ON public.deliverables(status);

DO $$ DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['creators','campaigns','deliverables','contacts']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_updated_at ON public.%I', t);
    EXECUTE format('CREATE TRIGGER trg_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t);
  END LOOP;
END $$;
