import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, verifyIdToken, isUserAdmin } from '@/lib/firebase-admin';

// POST - Change admin email
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { newEmail } = body;

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

        // Validate email
        if (!newEmail || !newEmail.includes('@')) {
            return NextResponse.json(
                { success: false, error: 'Please provide a valid email address' },
                { status: 400 }
            );
        }

        // Check if email is already in use
        try {
            const existingUser = await adminAuth.getUserByEmail(newEmail);
            if (existingUser && existingUser.uid !== userId) {
                return NextResponse.json(
                    { success: false, error: 'This email is already in use by another account' },
                    { status: 400 }
                );
            }
        } catch (error: any) {
            // auth/user-not-found is expected if email is not in use
            if (error.code !== 'auth/user-not-found') {
                throw error;
            }
        }

        // Update email in Firebase Auth
        await adminAuth.updateUser(userId, {
            email: newEmail,
            emailVerified: true,
        });

        // Update email in Firestore user document
        await adminDb.collection('users').doc(userId).update({
            email: newEmail,
            updatedAt: new Date(),
        });

        return NextResponse.json({
            success: true,
            message: 'Email updated successfully',
            newEmail,
        });
    } catch (error: any) {
        console.error('Change Email Error:', error);
        
        // Handle specific Firebase errors
        if (error.code === 'auth/invalid-email') {
            return NextResponse.json(
                { success: false, error: 'Invalid email format' },
                { status: 400 }
            );
        }
        
        return NextResponse.json(
            { success: false, error: 'Failed to change email' },
            { status: 500 }
        );
    }
}

