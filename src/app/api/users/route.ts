import { NextRequest, NextResponse } from 'next/server';
import { UserWithStats } from '@/types';
import { adminDb, verifyIdToken, isUserAdmin } from '@/lib/firebase-admin';

// GET - List all users with stats (admin only)
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

        // Verify token and get user ID
        const decodedToken = await verifyIdToken(token);
        const userId = decodedToken.uid;

        // Verify admin status
        const isAdmin = await isUserAdmin(userId);
        if (!isAdmin) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized - Admin access required' },
                { status: 403 }
            );
        }

        // Get query parameters
        const searchParams = request.nextUrl.searchParams;
        const filterOnboarded = searchParams.get('onboarded');
        const filterAdmin = searchParams.get('admin');

        // Fetch all users
        const usersSnapshot = await adminDb.collection('users').get();

        // Fetch all skills and connections
        const [skillsSnapshot, connectionsSnapshot] = await Promise.all([
            adminDb.collection('skills').get(),
            adminDb.collection('connections').get(),
        ]);

        // Count skills and connections per user
        const skillsCounts: Record<string, number> = {};
        const connectionsCounts: Record<string, number> = {};

        skillsSnapshot.forEach((doc) => {
            const uid = doc.data().userId;
            if (uid) {
                skillsCounts[uid] = (skillsCounts[uid] || 0) + 1;
            }
        });

        connectionsSnapshot.forEach((doc) => {
            const uid = doc.data().userId;
            if (uid) {
                connectionsCounts[uid] = (connectionsCounts[uid] || 0) + 1;
            }
        });

        // Build users with stats
        let users: UserWithStats[] = usersSnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                email: data.email || '',
                displayName: data.displayName,
                isAdmin: data.isAdmin || false,
                isPrimaryAdmin: data.isPrimaryAdmin || false,
                madeAdminBy: data.madeAdminBy || null,
                onboardingComplete: data.onboardingComplete || false,
                createdAt: data.createdAt?.toDate() || new Date(),
                skillsCount: skillsCounts[doc.id] || 0,
                connectionsCount: connectionsCounts[doc.id] || 0,
                invitationId: data.invitationId || null,
                invitationType: data.invitationType || null,
            } as UserWithStats;
        });

        // Apply filters
        if (filterOnboarded === 'true') {
            users = users.filter(u => u.onboardingComplete);
        } else if (filterOnboarded === 'false') {
            users = users.filter(u => !u.onboardingComplete);
        }

        if (filterAdmin === 'true') {
            users = users.filter(u => u.isAdmin);
        } else if (filterAdmin === 'false') {
            users = users.filter(u => !u.isAdmin);
        }

        // Sort by creation date descending
        users.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        return NextResponse.json({
            success: true,
            data: { users },
        });
    } catch (error) {
        console.error('Get Users Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch users' },
            { status: 500 }
        );
    }
}

// PATCH - Update user (admin status, etc.)
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { targetUserId, updates } = body;

        const authHeader = request.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Verify token and get user ID
        const decodedToken = await verifyIdToken(token);
        const userId = decodedToken.uid;

        // Verify requesting user is admin
        const isAdmin = await isUserAdmin(userId);
        if (!isAdmin) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized - Admin access required' },
                { status: 403 }
            );
        }

        // Get the target user to check restrictions
        const targetUserDoc = await adminDb.collection('users').doc(targetUserId).get();
        if (!targetUserDoc.exists) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        const targetUserData = targetUserDoc.data();

        // Check admin removal restrictions
        if (typeof updates.isAdmin === 'boolean' && updates.isAdmin === false) {
            // Cannot remove primary admin
            if (targetUserData?.isPrimaryAdmin) {
                return NextResponse.json(
                    { success: false, error: 'Cannot remove primary admin status' },
                    { status: 403 }
                );
            }

            // Cannot remove admin who granted you admin rights
            const requestingUserDoc = await adminDb.collection('users').doc(userId).get();
            const requestingUserData = requestingUserDoc.data();
            if (requestingUserData?.madeAdminBy === targetUserId) {
                return NextResponse.json(
                    { success: false, error: 'Cannot remove admin who granted you admin rights' },
                    { status: 403 }
                );
            }
        }

        // Build update fields
        const updateFields: any = {
            updatedAt: new Date(),
        };

        if (typeof updates.isAdmin === 'boolean') {
            updateFields.isAdmin = updates.isAdmin;
            // Track who granted admin rights
            if (updates.isAdmin === true) {
                updateFields.madeAdminBy = userId;
            }
        }

        // Update target user
        await adminDb.collection('users').doc(targetUserId).update(updateFields);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update User Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update user' },
            { status: 500 }
        );
    }
}

// DELETE - Delete user and all related data (admin only)
export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();
        const { targetUserId } = body;

        const authHeader = request.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Verify token and get user ID
        const decodedToken = await verifyIdToken(token);
        const userId = decodedToken.uid;

        // Verify requesting user is admin
        const isAdmin = await isUserAdmin(userId);
        if (!isAdmin) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized - Admin access required' },
                { status: 403 }
            );
        }

        // Prevent self-deletion
        if (targetUserId === userId) {
            return NextResponse.json(
                { success: false, error: 'Cannot delete your own account' },
                { status: 400 }
            );
        }

        // Delete user's skills
        const skillsSnapshot = await adminDb.collection('skills')
            .where('userId', '==', targetUserId)
            .get();

        const skillsDeletePromises = skillsSnapshot.docs.map(doc => doc.ref.delete());

        // Delete user's connections
        const connectionsSnapshot = await adminDb.collection('connections')
            .where('userId', '==', targetUserId)
            .get();

        const connectionsDeletePromises = connectionsSnapshot.docs.map(doc => doc.ref.delete());

        // Execute all deletions in parallel
        await Promise.all([
            ...skillsDeletePromises,
            ...connectionsDeletePromises,
        ]);

        // Delete user document
        await adminDb.collection('users').doc(targetUserId).delete();

        return NextResponse.json({
            success: true,
            message: 'User and all related data deleted successfully'
        });
    } catch (error) {
        console.error('Delete User Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete user' },
            { status: 500 }
        );
    }
}
