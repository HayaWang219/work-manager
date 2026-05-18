ALTER TABLE public.creators       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliverables   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts       ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "creators: authenticated"       ON public.creators;
CREATE POLICY "creators: authenticated"       ON public.creators       FOR ALL USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "campaigns: authenticated"      ON public.campaigns;
CREATE POLICY "campaigns: authenticated"      ON public.campaigns      FOR ALL USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "campaign_links: authenticated" ON public.campaign_links;
CREATE POLICY "campaign_links: authenticated" ON public.campaign_links FOR ALL USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "deliverables: authenticated"   ON public.deliverables;
CREATE POLICY "deliverables: authenticated"   ON public.deliverables   FOR ALL USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "contacts: authenticated"       ON public.contacts;
CREATE POLICY "contacts: authenticated"       ON public.contacts       FOR ALL USING (auth.role() = 'authenticated');
