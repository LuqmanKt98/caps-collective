// Willingness levels for skills
export type WillingnessLevel = 'pro_bono' | 'sponsor' | 'discount' | 'advice' | 'vendor';

// Relationship strength for connections
export type RelationshipStrength = 'decision_maker' | 'strong_contact' | 'acquaintance';

// Skill categories
// Skill categories
export const SKILL_CATEGORIES = [
  'Sports & Coaching',
  'Education & Youth Development',
  'Event Planning & Community Outreach',
  'Facilities, Construction & Equipment',
  'Trades & Skilled Labour (Extended)',
  'Real Estate & Property Services',
  'Technology & Software',
  'Media, Photography & Videography',
  'Marketing, Branding & Communications',
  'Finance, Accounting & Insurance',
  'Legal & Compliance',
  'Healthcare & Wellness',
  'Consulting & Professional Services',
  'Arts, Entertainment & Creative',
  'Government, Public Sector & Politics (Extended)',
  'Business Owners & Entrepreneurs',
  'Non-Profit & Philanthropy',
  'Sales, Partnerships & Fundraising',
  'Logistics, Transportation & Operations',
  'Hospitality & Food Services',
  'Retail, E-Commerce & Merchandising',
  'Other'
] as const;

export type SkillCategory = typeof SKILL_CATEGORIES[number];

// Skills by category
export const SKILLS_BY_CATEGORY: Record<SkillCategory, string[]> = {
  'Sports & Coaching': ['Youth sports expertise', 'Coaching experience', 'Player development insight', 'Fitness training', 'Scouting', 'Analysis', 'Referee skills'],
  'Education & Youth Development': ['Teachers', 'Professors', 'Tutors', 'Early childhood specialists', 'Curriculum designers', 'Academic advisors', 'Leadership development', 'Mentorship'],
  'Event Planning & Community Outreach': ['Event planners', 'Coordinators', 'Festival organizers', 'Community engagement', 'Volunteer management', 'Venue planning', 'Logistics for large events'],
  'Facilities, Construction & Equipment': ['General contractors', 'Project managers', 'Facility maintenance', 'Turf installation', 'Carpentry', 'Roofing', 'Concrete', 'Landscaping', 'Excavation', 'Fencing', 'Snow removal', 'Equipment installation', 'Renovation specialists'],
  'Trades & Skilled Labour (Extended)': ['Electricians', 'Plumbers', 'HVAC technicians', 'Concrete specialists', 'Forming', 'Framing', 'Roofing', 'Siding', 'Drywall', 'Flooring', 'Millwork', 'Cabinetry', 'Welding', 'Fabrication', 'Machining', 'Steelworkers', 'Heavy equipment operators', 'Landscapers', 'Irrigation techs', 'Snow removal crews', 'Asphalt', 'Fencing', 'Turf installation', 'Signage mounting', 'Window installers', 'Door installers', 'Insulation', 'Demolition teams', 'General labourers', 'Site services'],
  'Real Estate & Property Services': ['Realtors', 'Builders', 'Developers', 'Appraisers', 'Inspectors', 'Property managers', 'Commercial leasing', 'Zoning guidance', 'Architects', 'Land surveyors'],
  'Technology & Software': ['IT support', 'Cybersecurity', 'Software developers', 'Web designers', 'App builders', 'Database architects', 'Cloud systems', 'Network engineers', 'AV installation'],
  'Media, Photography & Videography': ['Photographers', 'Videographers', 'Editors', 'Drone operators', 'Storytellers', 'Documentary producers', 'Sports media professionals'],
  'Marketing, Branding & Communications': ['Graphic designers', 'Brand strategists', 'PR professionals', 'Social media managers', 'Storytellers', 'Copywriters', 'Advertisers', 'Media buyers', 'Print design', 'Campaign development'],
  'Finance, Accounting & Insurance': ['Accountants', 'Financial planners', 'Auditors', 'Payroll specialists', 'Bookkeepers', 'Banking', 'Insurance brokers', 'Investment professionals'],
  'Legal & Compliance': ['Lawyers', 'Paralegals', 'Contract specialists', 'Risk managers', 'Policy advisors', 'HR compliance', 'Child safety compliance'],
  'Healthcare & Wellness': ['Doctors', 'Nurses', 'Physiotherapists', 'Chiropractors', 'RMTs', 'Sports medicine providers', 'Nutritionists', 'Mental performance coaches', 'Counselors', 'Psychologists'],
  'Consulting & Professional Services': ['Business consultants', 'Process improvement', 'Operational efficiency', 'HR specialists', 'Leadership coaching', 'Management consultants'],
  'Arts, Entertainment & Creative': ['Illustrators', 'Designers', 'Musicians', 'Animators', 'Set designers', 'Creative directors', 'Fashion designers', 'Costume makers', 'Performers'],
  'Government, Public Sector & Politics (Extended)': ['Political staffers', 'Municipal/provincial/federal government contacts', 'MP/MPP/Councillor connections', 'Campaign workers', 'Public servants', 'Policy advisors', 'School board contacts', 'Community advocates', 'Grant coordinators', 'Communications officers', 'Regulatory experts', 'Access to political offices', 'Advocacy networks'],
  'Business Owners & Entrepreneurs': ['Owners/operators of any type of business', 'Service providers', 'Manufacturers', 'Restaurateurs', 'Distributors', 'Franchise owners', 'Retail owners', 'Founders'],
  'Non-Profit & Philanthropy': ['Charity leaders', 'Fundraisers', 'Grant writers', 'Board members', 'Foundation contacts', 'Sponsorship connectors'],
  'Sales, Partnerships & Fundraising': ['Sales professionals', 'Corporate partnerships', 'Sponsorship acquisition', 'Donor relations', 'Fundraising strategy', 'Business development'],
  'Logistics, Transportation & Operations': ['Truck drivers', 'Delivery services', 'Fleet operators', 'Warehouse managers', 'Supply chain experts', 'Inventory management', 'Operations specialists'],
  'Hospitality & Food Services': ['Restaurant owners', 'Caterers', 'Chefs', 'Bakers', 'Event hospitality providers', 'Venue operators', 'Wholesale food suppliers'],
  'Retail, E-Commerce & Merchandising': ['Retail managers', 'Buyers', 'E-commerce operators', 'Product designers', 'Apparel makers', 'Shipping/fulfillment professionals'],
  'Other': []
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
  skills?: string[];
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
