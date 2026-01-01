import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// POST - Create a new response to a need
export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await adminAuth.verifyIdToken(token);
        const userId = decodedToken.uid;

        const body = await request.json();
        const { needId, message } = body;

        if (!needId || !message?.trim()) {
            return NextResponse.json(
                { success: false, error: 'Need ID and message are required' },
                { status: 400 }
            );
        }

        // Check if need exists and is active
        const needDoc = await adminDb.collection('needs').doc(needId).get();
        if (!needDoc.exists) {
            return NextResponse.json(
                { success: false, error: 'Need not found' },
                { status: 404 }
            );
        }

        const needData = needDoc.data();
        if (!needData?.isActive) {
            return NextResponse.json(
                { success: false, error: 'This need is no longer accepting responses' },
                { status: 400 }
            );
        }

        // Check if user already responded to this need
        const existingResponse = await adminDb
            .collection('need-responses')
            .where('needId', '==', needId)
            .where('userId', '==', userId)
            .limit(1)
            .get();

        if (!existingResponse.empty) {
            return NextResponse.json(
                { success: false, error: 'You have already submitted a response to this need' },
                { status: 400 }
            );
        }

        // Get user info
        const userDoc = await adminDb.collection('users').doc(userId).get();
        const userData = userDoc.data();

        // Create the response
        const responseData = {
            needId,
            userId,
            userName: userData?.displayName || userData?.firstName + ' ' + userData?.lastName || 'Anonymous',
            userEmail: userData?.email || decodedToken.email || '',
            message: message.trim(),
            status: 'pending',
            createdAt: FieldValue.serverTimestamp(),
        };

        const docRef = await adminDb.collection('need-responses').add(responseData);

        return NextResponse.json({
            success: true,
            data: {
                id: docRef.id,
                ...responseData,
                createdAt: new Date(),
            },
        });
    } catch (error) {
        console.error('Create Need Response Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to submit response' },
            { status: 500 }
        );
    }
}

// GET - Get responses (user gets their own, admin gets all for a need)
export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await adminAuth.verifyIdToken(token);
        const userId = decodedToken.uid;

        const { searchParams } = new URL(request.url);
        const needId = searchParams.get('needId');
        const userOnly = searchParams.get('userOnly') === 'true';

        // Check if user is admin
        const userDoc = await adminDb.collection('users').doc(userId).get();
        const isAdmin = userDoc.data()?.isAdmin === true;

        // Build query - avoid composite index requirements
        let query: FirebaseFirestore.Query = adminDb.collection('need-responses');

        if (needId) {
            query = query.where('needId', '==', needId);
        }

        // Non-admins can only see their own responses
        if (!isAdmin || userOnly) {
            query = query.where('userId', '==', userId);
        }

        // Only add orderBy if we're not filtering (to avoid index requirements)
        // When filtering, we'll sort in memory
        const snapshot = await query.get();
        const responses = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || new Date(),
            reviewedAt: doc.data().reviewedAt?.toDate?.() || null,
        }));

        // Sort by createdAt in descending order (newest first)
        responses.sort((a, b) => {
            const dateA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
            const dateB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
            return dateB - dateA;
        });

        return NextResponse.json({
            success: true,
            data: { responses },
        });
    } catch (error) {
        console.error('Get Need Responses Error:', error);
        console.error('Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
        });
        return NextResponse.json(
            { success: false, error: 'Failed to fetch responses' },
            { status: 500 }
        );
    }
}

// PATCH - Update response status (admin only)
export async function PATCH(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const token = authHeader.split('Bearer ')[1];
        const decodedToken = await adminAuth.verifyIdToken(token);
        const userId = decodedToken.uid;

        // Check if user is admin
        const userDoc = await adminDb.collection('users').doc(userId).get();
        const adminData = userDoc.data();
        if (!adminData?.isAdmin) {
            return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
        }

        const body = await request.json();
        const { responseId, status, adminNotes } = body;

        if (!responseId || !status) {
            return NextResponse.json(
                { success: false, error: 'Response ID and status are required' },
                { status: 400 }
            );
        }

        const validStatuses = ['pending', 'reviewed', 'accepted', 'declined'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json(
                { success: false, error: 'Invalid status' },
                { status: 400 }
            );
        }

        // Get the response to fetch user and need details
        const responseDoc = await adminDb.collection('need-responses').doc(responseId).get();
        if (!responseDoc.exists) {
            return NextResponse.json(
                { success: false, error: 'Response not found' },
                { status: 404 }
            );
        }

        const responseData = responseDoc.data();
        const previousStatus = responseData?.status;

        // Update the response
        const updateData: Record<string, unknown> = {
            status,
            reviewedAt: FieldValue.serverTimestamp(),
        };

        if (adminNotes !== undefined) {
            updateData.adminNotes = adminNotes;
        }

        await adminDb.collection('need-responses').doc(responseId).update(updateData);

        // Create notification for the user if status changed
        // NOTE: In-app notifications disabled for now
        /*
        if (responseData && previousStatus !== status) {
            const needDoc = await adminDb.collection('needs').doc(responseData.needId).get();
            const needData = needDoc.data();

            // Determine notification message based on status
            let notificationTitle = '';
            let notificationMessage = '';

            switch (status) {
                case 'reviewed':
                    notificationTitle = '👀 Response Reviewed';
                    notificationMessage = `Your response to "${needData?.title}" has been reviewed by an admin.`;
                    break;
                case 'accepted':
                    notificationTitle = '🎉 Response Accepted!';
                    notificationMessage = `Great news! Your response to "${needData?.title}" has been accepted. An admin will contact you soon.`;
                    break;
                case 'declined':
                    notificationTitle = '📋 Response Update';
                    notificationMessage = `Your response to "${needData?.title}" has been reviewed. Thank you for your interest!`;
                    break;
            }

            // Create notification for the user
            if (notificationTitle && responseData.userId) {
                try {
                    const expiresAt = new Date();
                    expiresAt.setDate(expiresAt.getDate() + 30); // Expire in 30 days

                    await adminDb.collection('notifications').add({
                        userId: responseData.userId,
                        type: 'need_match',
                        title: notificationTitle,
                        message: notificationMessage,
                        data: {
                            needId: responseData.needId,
                            needTitle: needData?.title,
                            needCategory: needData?.category,
                            responseId: responseId,
                            responseStatus: status,
                        },
                        read: false,
                        createdAt: FieldValue.serverTimestamp(),
                        expiresAt: expiresAt,
                    });
                } catch (notifError) {
                    console.error('Error creating notification:', notifError);
                    // Don't fail the request if notification creation fails
                }
            }
        }
        */

        return NextResponse.json({
            success: true,
            message: 'Response updated successfully',
        });
    } catch (error) {
        console.error('Update Need Response Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update response' },
            { status: 500 }
        );
    }
}
