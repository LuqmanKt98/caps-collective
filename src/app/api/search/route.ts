import { NextRequest, NextResponse } from 'next/server';
import { Skill, Connection, SearchResult, WillingnessLevel } from '@/types';

// Scoring weights
const WEIGHTS = {
  DIRECT_SKILL: 3,
  CONNECTION: 2,
  HOBBY_SKILL: 1,
};

// Willingness multipliers
const WILLINGNESS_MULTIPLIERS: Record<WillingnessLevel, number> = {
  pro_bono: 3,
  sponsor: 2.5,
  discount: 1.5,
  advice: 1,
  vendor: 0.75,
};

function scoreToStrengthMeter(score: number, maxScore: number): number {
  if (maxScore === 0) return 1;
  const normalized = score / maxScore;
  if (normalized >= 0.8) return 5;
  if (normalized >= 0.6) return 4;
  if (normalized >= 0.4) return 3;
  if (normalized >= 0.2) return 2;
  return 1;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const q = searchParams.get('q')?.toLowerCase() || '';
  const limit = parseInt(searchParams.get('limit') || '20');

  if (!q || q.length < 2) {
    return NextResponse.json(
      { success: false, error: 'Search query must be at least 2 characters' },
      { status: 400 }
    );
  }

  try {
    // Get authorization token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const projectId = 'caps-collective';

    // Get all skills using Firestore REST API
    const skillsResponse = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/skills`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!skillsResponse.ok) {
      throw new Error(`Failed to fetch skills: ${skillsResponse.statusText}`);
    }

    const skillsData = await skillsResponse.json();
    const allSkills = (skillsData.documents || []).map((doc: any) => {
      const fields = doc.fields;
      return {
        id: doc.name.split('/').pop(),
        userId: fields.userId?.stringValue || '',
        skillName: fields.skillName?.stringValue || '',
        category: fields.category?.stringValue || '',
        willingnessLevel: fields.willingnessLevel?.stringValue || 'advice',
        isHobby: fields.isHobby?.booleanValue || false,
      } as Skill;
    });

    // Get all connections using Firestore REST API
    const connectionsResponse = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/connections`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (!connectionsResponse.ok) {
      throw new Error(`Failed to fetch connections: ${connectionsResponse.statusText}`);
    }

    const connectionsData = await connectionsResponse.json();
    const allConnections = (connectionsData.documents || []).map((doc: any) => {
      const fields = doc.fields;
      return {
        id: doc.name.split('/').pop(),
        userId: fields.userId?.stringValue || '',
        organizationName: fields.organizationName?.stringValue || '',
        contactName: fields.contactName?.stringValue || '',
        relationshipStrength: fields.relationshipStrength?.stringValue || 'acquaintance',
        sector: fields.sector?.stringValue || '',
      } as Connection;
    });

    // Search and score
    const userScores = new Map<string, {
      score: number;
      matchedSkills: Skill[];
      matchedConnections: Connection[];
      directSkillMatches: number;
      connectionMatches: number;
      hobbySkillMatches: number;
    }>();

    // Search skills
    for (const skill of allSkills) {
      const matchesCategory = skill.category.toLowerCase().includes(q);
      const matchesSkillName = skill.skillName.toLowerCase().includes(q);

      if (matchesCategory || matchesSkillName) {
        const multiplier = WILLINGNESS_MULTIPLIERS[skill.willingnessLevel as WillingnessLevel] || 1;
        const points = skill.isHobby
          ? WEIGHTS.HOBBY_SKILL * multiplier
          : WEIGHTS.DIRECT_SKILL * multiplier;

        const current = userScores.get(skill.userId) || {
          score: 0,
          matchedSkills: [],
          matchedConnections: [],
          directSkillMatches: 0,
          connectionMatches: 0,
          hobbySkillMatches: 0,
        };

        current.score += points;
        current.matchedSkills.push(skill);
        if (skill.isHobby) current.hobbySkillMatches++;
        else current.directSkillMatches++;

        userScores.set(skill.userId, current);
      }
    }

    // Search connections
    for (const conn of allConnections) {
      const matchesSector = conn.sector.toLowerCase().includes(q);
      const matchesOrg = conn.organizationName.toLowerCase().includes(q);
      const matchesContact = conn.contactName?.toLowerCase().includes(q);

      if (matchesSector || matchesOrg || matchesContact) {
        let strengthMultiplier = 1;
        if (conn.relationshipStrength === 'decision_maker') strengthMultiplier = 1.5;
        else if (conn.relationshipStrength === 'strong_contact') strengthMultiplier = 1.2;

        const points = WEIGHTS.CONNECTION * strengthMultiplier;

        const current = userScores.get(conn.userId) || {
          score: 0,
          matchedSkills: [],
          matchedConnections: [],
          directSkillMatches: 0,
          connectionMatches: 0,
          hobbySkillMatches: 0,
        };

        current.score += points;
        current.matchedConnections.push(conn);
        current.connectionMatches++;

        userScores.set(conn.userId, current);
      }
    }

    // Build results with user info
    const results: SearchResult[] = [];
    let maxScore = 0;

    for (const [userId, data] of userScores) {
      // Fetch user data using Firestore REST API
      const userResponse = await fetch(
        `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      let userData: any = {};
      if (userResponse.ok) {
        const userDoc = await userResponse.json();
        const fields = userDoc.fields || {};
        userData = {
          email: fields.email?.stringValue || '',
          displayName: fields.displayName?.stringValue || '',
          profilePhoto: fields.profilePhoto?.stringValue || '',
        };
      }

      if (data.score > maxScore) maxScore = data.score;

      results.push({
        userId,
        userEmail: userData.email || '',
        userName: userData.displayName,
        userProfilePhoto: userData.profilePhoto,
        score: data.score,
        strengthMeter: 0,
        matchDetails: {
          directSkillMatches: data.directSkillMatches,
          connectionMatches: data.connectionMatches,
          hobbySkillMatches: data.hobbySkillMatches,
        },
        matchedSkills: data.matchedSkills,
        matchedConnections: data.matchedConnections,
      });
    }

    const sortedResults = results
      .map(r => ({ ...r, strengthMeter: scoreToStrengthMeter(r.score, maxScore) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      data: sortedResults,
      metadata: {
        query: q,
        totalResults: results.length,
        returned: sortedResults.length,
      },
    });
  } catch (error) {
    console.error('Search API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Search failed' },
      { status: 500 }
    );
  }
}

