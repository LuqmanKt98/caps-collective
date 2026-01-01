// Willingness levels for skills
export type WillingnessLevel = 'pro_bono' | 'sponsor' | 'discount' | 'advice' | 'vendor';

// Relationship strength for connections
export type RelationshipStrength = 'decision_maker' | 'strong_contact' | 'acquaintance';

// Skill categories
export const SKILL_CATEGORIES = [
  'Sports & Coaching',
  'Youth Development',
  'Event Planning',
  'Facilities & Equipment',
  'Education',
  'Healthcare',
  'Technology',
  'Media',
  'Marketing',
  'Finance',
  'Legal',
  'Trades',
  'Real Estate',
  'Consulting',
  'Arts & Entertainment',
  'Non-Profit',
  'Government',
  'Other'
] as const;

export type SkillCategory = typeof SKILL_CATEGORIES[number];

// Skills by category
export const SKILLS_BY_CATEGORY: Record<SkillCategory, string[]> = {
  'Sports & Coaching': ['Soccer Coaching', 'Referee/Officiating', 'Athletic Training', 'Sports Medicine', 'Fitness Training', 'Team Management', 'Sports Psychology'],
  'Youth Development': ['Mentoring', 'Leadership Training', 'Character Development', 'Life Skills', 'Academic Support', 'Career Guidance', 'Conflict Resolution'],
  'Event Planning': ['Tournament Organization', 'Game Day Operations', 'Fundraising Events', 'Team Parties', 'Award Ceremonies', 'Travel Coordination', 'Venue Management'],
  'Facilities & Equipment': ['Field Maintenance', 'Equipment Management', 'Facility Setup', 'Safety Inspections', 'Groundskeeping', 'Equipment Repair', 'Inventory Management'],
  'Education': ['Tutoring', 'College Counseling', 'Professional Training', 'Language Instruction', 'Early Childhood', 'Special Education', 'STEM Education'],
  'Healthcare': ['Medical', 'Dental', 'Mental Health', 'Physical Therapy', 'Nursing', 'Pharmacy', 'Nutrition', 'Sports Medicine'],
  'Technology': ['Web Development', 'Mobile Apps', 'IT Support', 'Cybersecurity', 'Data Analytics', 'AI/ML', 'Cloud Services', 'Video Streaming'],
  'Media': ['Video Production', 'Photography', 'Graphic Design', 'Social Media', 'PR/Communications', 'Journalism', 'Podcasting', 'Live Streaming'],
  'Marketing': ['Digital Marketing', 'SEO/SEM', 'Branding', 'Copywriting', 'Email Marketing', 'Market Research', 'Sponsorship', 'Community Outreach'],
  'Finance': ['Accounting', 'Tax Preparation', 'Financial Planning', 'Investment', 'Banking', 'Insurance', 'Bookkeeping', 'Fundraising'],
  'Legal': ['Corporate Law', 'Real Estate Law', 'Family Law', 'Immigration', 'Criminal Defense', 'Intellectual Property', 'Contracts', 'Sports Law'],
  'Trades': ['Plumbing', 'Electrical', 'HVAC', 'Carpentry', 'Roofing', 'Landscaping', 'General Contractor', 'Painting'],
  'Real Estate': ['Residential Sales', 'Commercial Sales', 'Property Management', 'Appraisal', 'Mortgage', 'Title Services'],
  'Consulting': ['Business Strategy', 'HR/Recruiting', 'Operations', 'Change Management', 'Project Management', 'Organizational Development'],
  'Arts & Entertainment': ['Music', 'Acting', 'Writing', 'Visual Arts', 'Dance', 'Catering', 'Entertainment', 'Performance'],
  'Non-Profit': ['Fundraising', 'Grant Writing', 'Volunteer Management', 'Program Development', 'Board Governance', 'Community Engagement'],
  'Government': ['Lobbying', 'Policy', 'Community Relations', 'Licensing/Permits', 'Public Affairs', 'Municipal Services'],
  'Other': ['Translation', 'Research', 'Personal Services', 'Transportation', 'Childcare', 'Pet Services', 'Administrative Support']
};

// Connection sectors
export const CONNECTION_SECTORS = [
  'Corporate',
  'Government',
  'Non-Profit',
  'Education',
  'Healthcare',
  'Faith-Based',
  'Community Organization',
  'Small Business',
  'Media',
  'Sports & Recreation',
  'Arts & Culture',
  'Technology',
  'Finance',
  'Legal',
  'Other'
] as const;

export type ConnectionSector = typeof CONNECTION_SECTORS[number];

// User document type
export interface User {
  id: string;
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  bio?: string;
  profilePhoto?: string; // URL to profile photo
  linkedinUrl?: string;
  location?: string;
  isAdmin: boolean;
  isPrimaryAdmin?: boolean; // First admin cannot be demoted
  madeAdminBy?: string; // User ID of admin who granted admin rights
  onboardingComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
  invitationId?: string; // ID of the invitation used to join
  invitationType?: 'personal' | 'public';
  invitedBy?: string;
  joinedViaInvitationAt?: Date;
}

// Skill entry type
export interface Skill {
  id: string;
  userId: string;
  category: SkillCategory;
  skillName: string;
  willingnessLevel: WillingnessLevel;
  isHobby?: boolean;
  createdAt: Date;
}

// Connection entry type
export interface Connection {
  id: string;
  userId: string;
  sector: ConnectionSector;
  organizationName: string;
  relationshipStrength: RelationshipStrength;
  contactName?: string;
  createdAt: Date;
}

// Need (bulletin board post) type
export interface Need {
  id: string;
  title: string;
  description: string;
  category: SkillCategory;
  createdBy: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Need Response (user application/interest in a need)
export interface NeedResponse {
  id: string;
  needId: string;
  userId: string;
  userName: string;
  userEmail: string;
  message: string;
  status: 'pending' | 'reviewed' | 'accepted' | 'declined';
  createdAt: Date;
  reviewedAt?: Date;
  adminNotes?: string;
}

// Caps Score result type
export interface CapsScoreResult {
  userId: string;
  userEmail: string;
  userName?: string;
  userPhoneNumber?: string;
  userBio?: string;
  userProfilePhoto?: string;
  score: number;
  strengthMeter: number; // 1-5 scale
  matchDetails: {
    directSkillMatches: number;
    connectionMatches: number;
    hobbySkillMatches: number;
  };
}

// Search result type
export interface SearchResult extends CapsScoreResult {
  matchedSkills: Skill[];
  matchedConnections: Connection[];
}

// Invitation type (supports both personal email and public links)
export type InvitationType = 'personal' | 'public';

export interface EmailInvitation {
  id: string;
  email?: string; // Optional for public links
  invitedBy: string;
  status: 'pending' | 'accepted' | 'expired';
  type: InvitationType;
  name?: string; // Label for public links (e.g., "Community Link")
  usageCount?: number; // How many times a public link was used
  createdAt: Date;
  expiresAt?: Date; // Optional - null means never expires
  token?: string; // The invitation token
}

// Scoring Configuration (AI-optimized)
export interface ScoringConfig {
  id: string;
  weights: {
    directSkill: number;
    connection: number;
    hobbySkill: number;
  };
  willingnessMultipliers: {
    pro_bono: number;
    sponsor: number;
    discount: number;
    advice: number;
    vendor: number;
  };
  relationshipMultipliers: {
    decision_maker: number;
    strong_contact: number;
    acquaintance: number;
  };
  strengthMeterThresholds: {
    tier5: number;
    tier4: number;
    tier3: number;
    tier2: number;
  };
  aiAnalysis?: {
    reasoning: string;
    confidence: number;
    dataPointsAnalyzed: number;
    lastAnalyzedAt: Date;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// User with aggregated statistics
export interface UserWithStats {
  id: string;
  email: string;
  displayName?: string;
  isAdmin: boolean;
  isPrimaryAdmin?: boolean;
  madeAdminBy?: string;
  onboardingComplete: boolean;
  createdAt: Date;
  skillsCount: number;
  connectionsCount: number;
  invitationId?: string;
  invitationType?: 'personal' | 'public';
}

// Invitation with detailed tracking
export interface InvitationWithDetails extends EmailInvitation {
  inviterEmail?: string;
  inviterName?: string;
  acceptedAt?: Date;
  acceptedByName?: string;
  invitationLink?: string; // The full invitation URL
}

// Analytics summary for dashboard
export interface AnalyticsSummary {
  totalUsers: number;
  totalAdmins: number;
  onboardedUsers: number;
  pendingOnboarding: number;
  totalSkills: number;
  totalConnections: number;
  totalNeeds: number;
  activeNeeds: number;
  pendingInvitations: number;
  acceptedInvitations: number;
  topSkillCategories: { category: string; count: number }[];
  topConnectionSectors: { sector: string; count: number }[];
  recentUsers: { email: string; createdAt: Date }[];
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Notification types
export type NotificationType = 'need_match' | 'invitation' | 'system';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: {
    needId?: string;
    needTitle?: string;
    needCategory?: string;
    score?: number;
    [key: string]: any;
  };
  read: boolean;
  createdAt: Date;
  expiresAt: Date;
}
