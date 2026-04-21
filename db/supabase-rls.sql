-- Enable RLS on all tables
ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_state       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_links      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_docs        ENABLE ROW LEVEL SECURITY;

-- ── profiles: own row only ─────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles: own row" ON public.profiles;
CREATE POLICY "profiles: own row" ON public.profiles
  FOR ALL USING (id = auth.uid());

-- ── tasks: own rows only ───────────────────────────────────────────────
DROP POLICY IF EXISTS "tasks: own rows" ON public.tasks;
CREATE POLICY "tasks: own rows" ON public.tasks
  FOR ALL USING (user_id = auth.uid());

-- ── recurring_templates: own rows only ────────────────────────────────
DROP POLICY IF EXISTS "recurring: own rows" ON public.recurring_templates;
CREATE POLICY "recurring: own rows" ON public.recurring_templates
  FOR ALL USING (user_id = auth.uid());

-- ── notes: own rows only ──────────────────────────────────────────────
DROP POLICY IF EXISTS "notes: own rows" ON public.notes;
CREATE POLICY "notes: own rows" ON public.notes
  FOR ALL USING (user_id = auth.uid());

-- ── system_state: any authenticated user can read/write ───────────────
DROP POLICY IF EXISTS "system_state: authenticated" ON public.system_state;
CREATE POLICY "system_state: authenticated" ON public.system_state
  FOR ALL USING (auth.role() = 'authenticated');

-- ── projects: any authenticated user ──────────────────────────────────
DROP POLICY IF EXISTS "projects: authenticated" ON public.projects;
CREATE POLICY "projects: authenticated" ON public.projects
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "project_links: authenticated" ON public.project_links;
CREATE POLICY "project_links: authenticated" ON public.project_links
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "project_items: authenticated" ON public.project_items;
CREATE POLICY "project_items: authenticated" ON public.project_items
  FOR ALL USING (auth.role() = 'authenticated');

-- ── report_docs: any authenticated user ───────────────────────────────
DROP POLICY IF EXISTS "report_docs: authenticated" ON public.report_docs;
CREATE POLICY "report_docs: authenticated" ON public.report_docs
  FOR ALL USING (auth.role() = 'authenticated');
