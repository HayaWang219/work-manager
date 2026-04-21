-- ── Profiles (auto-created on signup) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  role         TEXT NOT NULL DEFAULT 'admin',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger: create profile row when a new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Private tables (scoped per user) ──────────────────────────────────

CREATE TABLE IF NOT EXISTS public.tasks (
  id             BIGSERIAL PRIMARY KEY,
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title          TEXT NOT NULL,
  notes          TEXT,
  status         TEXT NOT NULL DEFAULT 'todo',
  category       TEXT,
  is_today       BOOLEAN NOT NULL DEFAULT false,
  report_flag    BOOLEAN NOT NULL DEFAULT false,
  is_recurring   BOOLEAN NOT NULL DEFAULT false,
  recurring_id   BIGINT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at   TIMESTAMPTZ,
  due_date       DATE,
  scheduled_date DATE
);

CREATE TABLE IF NOT EXISTS public.recurring_templates (
  id         BIGSERIAL PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  category   TEXT,
  notes      TEXT,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notes (
  id         BIGSERIAL PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content    TEXT NOT NULL,
  pinned     BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Shared tables (visible to all authenticated users) ────────────────

CREATE TABLE IF NOT EXISTS public.system_state (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.system_state (key, value)
VALUES ('last_monday_reset', '1970-01-01')
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.projects (
  id           BIGSERIAL PRIMARY KEY,
  title        TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'active',
  next_step    TEXT,
  notes        TEXT,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.project_links (
  id         BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  label      TEXT,
  url        TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_items (
  id         BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  progress   TEXT,
  next_step  TEXT,
  due_date   DATE,
  status     TEXT NOT NULL DEFAULT 'active',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.report_docs (
  id         BIGSERIAL PRIMARY KEY,
  date       DATE NOT NULL,
  title      TEXT,
  content    TEXT NOT NULL DEFAULT '',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Indexes ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tasks_user       ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status     ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled  ON public.tasks(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_notes_user       ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_user   ON public.recurring_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status  ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_project_items_p  ON public.project_items(project_id);
CREATE INDEX IF NOT EXISTS idx_project_links_p  ON public.project_links(project_id);
CREATE INDEX IF NOT EXISTS idx_report_docs_date ON public.report_docs(date DESC);

-- ── updated_at auto-update trigger ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DO $$ DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['tasks','notes','projects','project_items','report_docs','profiles']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_updated_at ON public.%I', t);
    EXECUTE format('CREATE TRIGGER trg_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', t);
  END LOOP;
END $$;
