import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
    try {
        const { token, userId, userEmail, userName } = await request.json();

        if (!token) {
            return NextResponse.json(
                { success: false, error: 'Invitation token is required' },
                { status: 400 }
            );
        }

        // Find the invitation by token
        const invitationsSnapshot = await adminDb.collection('invitations')
            .where('token', '==', token)
            .limit(1)
            .get();

        if (invitationsSnapshot.empty) {
            return NextResponse.json(
                { success: false, error: 'Invalid invitation token' },
                { status: 404 }
            );
        }

        const invitationDoc = invitationsSnapshot.docs[0];
        const invitationData = invitationDoc.data();

        // Check if invitation is already expired (only for personal invitations)
        if (invitationData.status === 'expired') {
            return NextResponse.json(
                { success: false, error: 'This invitation has expired' },
                { status: 400 }
            );
        }

        // Expiry check removed - all invitations are now infinite


        const now = new Date();

        if (invitationData.type === 'public') {
            await invitationDoc.ref.update({
                usageCount: FieldValue.increment(1),
                lastUsedAt: now,
                lastUsedBy: userId || null,
                lastUsedByEmail: userEmail || null,
            });
        } else {
            // For personal invitations, mark as accepted
            await invitationDoc.ref.update({
                status: 'accepted',
                acceptedAt: now,
                acceptedBy: userId || null,
                acceptedByName: userName || userEmail || null,
            });
        }

        // Link invitation to user for tracking
        if (userId) {
            try {
                await adminDb.collection('users').doc(userId).update({
                    invitationId: invitationDoc.id,
                    invitationType: invitationData.type,
                    invitedBy: invitationData.invitedBy || null,
                    joinedViaInvitationAt: now
                });
            } catch (error) {
                console.error('Failed to link invitation to user:', error);
                // Continue execution, don't fail the request
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                type: invitationData.type,
                name: invitationData.name,
            }
        });
    } catch (error) {
        console.error('Accept invitation error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to accept invitation' },
            { status: 500 }
        );
    }
}
