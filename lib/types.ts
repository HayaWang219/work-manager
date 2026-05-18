// Type definitions for the Influencer Marketing Manager (NVIDIA GeForce)

export type CreatorStatus = 'prospect' | 'evaluating' | 'active' | 'inactive' | 'blacklisted';
export type CreatorTier = 'top' | 'mid' | 'micro' | 'nano';
export type DeliverableStatus = 'prospect' | 'contacted' | 'onboarding' | 'brief_sent' | 'draft_review' | 'approved' | 'published' | 'data_in';

export interface Creator {
  id: number;
  handle: string;
  real_name: string | null;
  email: string | null;
  platforms: string[];
  primary_platform: string | null;
  tier: CreatorTier;
  niche: string[];
  status: CreatorStatus;
  subscribers: number | null;
  avg_views: number | null;
  engagement_rate: number | null;
  country: string | null;
  language: string;
  agency: string | null;
  agency_contact: string | null;
  rate_card: string | null;
  affinity_tags: string[];
  profile_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: number;
  title: string;
  product: string | null;
  campaign_type: string;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  brief_url: string | null;
  budget: number | null;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  sort_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  links?: CampaignLink[];
  deliverables?: Deliverable[];
}

export interface CampaignLink {
  id: number;
  campaign_id: number;
  label: string | null;
  url: string;
  created_at: string;
}

export interface Deliverable {
  id: number;
  campaign_id: number;
  creator_id: number;
  deliverable_type: string;
  platform: string | null;
  status: DeliverableStatus;
  due_date: string | null;
  publish_date: string | null;
  content_url: string | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  payment_amount: number | null;
  payment_status: 'pending' | 'invoiced' | 'paid';
  notes: string | null;
  created_at: string;
  updated_at: string;
  creator?: Pick<Creator, 'id' | 'handle' | 'tier' | 'primary_platform'>;
  campaign?: Pick<Campaign, 'id' | 'title'>;
}

export interface Contact {
  id: number;
  name: string;
  org: string | null;
  org_type: 'agency' | 'brand' | 'internal' | 'legal';
  role: string | null;
  email: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: number;
  user_id: string;
  content: string;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReportDoc {
  id: number;
  date: string;
  title: string | null;
  content: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
