import { NextRequest, NextResponse } from 'next/server';
import { adminDb, verifyIdToken, isUserAdmin } from '@/lib/firebase-admin';
import { User, Skill, Connection } from '@/types';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const targetUserId = searchParams.get('userId');

        if (!targetUserId) {
            return NextResponse.json(
                { success: false, error: 'User ID is required' },
                { status: 400 }
            );
        }

        const authHeader = request.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '');

        if (!token) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Verify token and get requester ID
        const decodedToken = await verifyIdToken(token);
        const requesterId = decodedToken.uid;

        // Verify requester is admin
        const isAdmin = await isUserAdmin(requesterId);
        if (!isAdmin) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized - Admin access required' },
                { status: 403 }
            );
        }

        // Fetch user profile
        const userDoc = await adminDb.collection('users').doc(targetUserId).get();
        if (!userDoc.exists) {
            return NextResponse.json(
                { success: false, error: 'User not found' },
                { status: 404 }
            );
        }

        // Fetch skills
        const skillsSnapshot = await adminDb.collection('skills')
            .where('userId', '==', targetUserId)
            .get();

        // Fetch connections
        const connectionsSnapshot = await adminDb.collection('connections')
            .where('userId', '==', targetUserId)
            .get();

        // Map data
        const user = { id: userDoc.id, ...userDoc.data() } as User;

        // Ensure dates are converted to strings/dates for JSON
        // Firestore dates need handling if we want to work with them on client easily, 
        // but JSON.stringify usually handles them or we might get objects. 
        // Usually simple toDate() for the client consumption.

        const skills = skillsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // handle dates if needed, usually serializable is fine
        })) as Skill[];

        const connections = connectionsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        })) as Connection[];

        return NextResponse.json({
            success: true,
            data: {
                user,
                skills,
                connections
            }
        });

    } catch (error) {
        console.error('Get User Details Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch user details' },
            { status: 500 }
        );
    }
}
