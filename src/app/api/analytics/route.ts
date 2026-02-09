import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsSummary } from '@/types';

// GET - Get analytics summary (admin only)
export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const projectId = 'caps-collective';
        const searchParams = request.nextUrl.searchParams;
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'User ID required' },
                { status: 400 }
            );
        }

        // Verify admin status
        const userResponse = await fetch(
            `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${userId}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            }
        );

        if (!userResponse.ok) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        const userData = await userResponse.json();
        const isAdmin = userData.fields?.isAdmin?.booleanValue || false;

        if (!isAdmin) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized - Admin access required' },
                { status: 403 }
            );
        }

        // Fetch all collections data
        const [usersRes, skillsRes, connectionsRes, needsRes, invitationsRes] = await Promise.all([
            fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users`, {
                headers: { 'Authorization': `Bearer ${token}` },
            }),
            fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/skills`, {
                headers: { 'Authorization': `Bearer ${token}` },
            }),
            fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/connections`, {
                headers: { 'Authorization': `Bearer ${token}` },
            }),
            fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/needs`, {
                headers: { 'Authorization': `Bearer ${token}` },
            }),
            fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/invitations`, {
                headers: { 'Authorization': `Bearer ${token}` },
            }),
        ]);

        const [usersData, skillsData, connectionsData, needsData, invitationsData] = await Promise.all([
            usersRes.ok ? usersRes.json() : { documents: [] },
            skillsRes.ok ? skillsRes.json() : { documents: [] },
            connectionsRes.ok ? connectionsRes.json() : { documents: [] },
            needsRes.ok ? needsRes.json() : { documents: [] },
            invitationsRes.ok ? invitationsRes.json() : { documents: [] },
        ]);

        const users = usersData.documents || [];
        const skills = skillsData.documents || [];
        const connections = connectionsData.documents || [];
        const needs = needsData.documents || [];
        const invitations = invitationsData.documents || [];

        // Extract active user IDs to filter orphaned data
        const activeUserIds = new Set(users.map((u: any) => {
            const pathParts = u.name.split('/');
            return pathParts[pathParts.length - 1];
        }));

        // Filter collections to remove orphaned data
        const activeSkills = skills.filter((s: any) => activeUserIds.has(s.fields?.userId?.stringValue));
        const activeConnections = connections.filter((c: any) => activeUserIds.has(c.fields?.userId?.stringValue));
        const activeNeedsData = needs.filter((n: any) => activeUserIds.has(n.fields?.createdBy?.stringValue));

        // Calculate totals
        const totalUsers = users.length;
        const totalAdmins = users.filter((u: any) => u.fields?.isAdmin?.booleanValue).length;
        const onboardedUsers = users.filter((u: any) => u.fields?.onboardingComplete?.booleanValue).length;
        const pendingOnboarding = totalUsers - onboardedUsers;
        const totalSkills = activeSkills.length;
        const totalConnections = activeConnections.length;
        const totalNeeds = activeNeedsData.length;
        const activeNeeds = activeNeedsData.filter((n: any) => n.fields?.isActive?.booleanValue !== false).length;
        const pendingInvitations = invitations.filter((i: any) => i.fields?.status?.stringValue === 'pending').length;
        const acceptedInvitations = invitations.filter((i: any) => i.fields?.status?.stringValue === 'accepted').length;

        // Top skill categories
        const skillCategoryCounts: Record<string, number> = {};
        activeSkills.forEach((skill: any) => {
            const category = skill.fields?.category?.stringValue;
            if (category) {
                skillCategoryCounts[category] = (skillCategoryCounts[category] || 0) + 1;
            }
        });
        const topSkillCategories = Object.entries(skillCategoryCounts)
            .map(([category, count]) => ({ category, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // Top connection sectors
        const connectionSectorCounts: Record<string, number> = {};
        activeConnections.forEach((conn: any) => {
            const sector = conn.fields?.sector?.stringValue;
            if (sector) {
                connectionSectorCounts[sector] = (connectionSectorCounts[sector] || 0) + 1;
            }
        });
        const topConnectionSectors = Object.entries(connectionSectorCounts)
            .map(([sector, count]) => ({ sector, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        // Recent users (last 5)
        const recentUsers = users
            .map((u: any) => ({
                email: u.fields?.email?.stringValue || '',
                createdAt: u.fields?.createdAt?.timestampValue ? new Date(u.fields.createdAt.timestampValue) : new Date(),
            }))
            .sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, 5);

        const analytics: AnalyticsSummary = {
            totalUsers,
            totalAdmins,
            onboardedUsers,
            pendingOnboarding,
            totalSkills,
            totalConnections,
            totalNeeds,
            activeNeeds,
            pendingInvitations,
            acceptedInvitations,
            topSkillCategories,
            topConnectionSectors,
            recentUsers,
        };

        return NextResponse.json({
            success: true,
            data: analytics,
        });
    } catch (error) {
        console.error('Get Analytics Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch analytics' },
            { status: 500 }
        );
    }
}
