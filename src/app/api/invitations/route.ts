import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { InvitationWithDetails } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { adminDb, verifyIdToken, isUserAdmin } from '@/lib/firebase-admin';

// GET - List all invitations (admin only)
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

        // Fetch all invitations
        const invitationsSnapshot = await adminDb.collection('invitations').get();

        // Use Vercel production URL (not preview), or configured base URL, or localhost for dev
        // VERCEL_PROJECT_PRODUCTION_URL gives clean domain like "caps-collective.vercel.app"
        // VERCEL_URL gives preview URLs like "caps-collective-git-main-xxx.vercel.app"
        // Use custom domain for production, preview URL for non-prod Vercel, or localhost for dev
        const baseUrl = process.env.VERCEL_ENV === 'production'
            ? 'https://www.capscollective.ca'
            : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'));

        const invitations: InvitationWithDetails[] = await Promise.all(
            invitationsSnapshot.docs.map(async (doc) => {
                const data = doc.data();
                const inviterId = data.invitedBy;

                // Fetch inviter details
                let inviterEmail = '';
                let inviterName = '';
                if (inviterId) {
                    try {
                        const inviterDoc = await adminDb.collection('users').doc(inviterId).get();
                        if (inviterDoc.exists) {
                            const inviterData = inviterDoc.data();
                            inviterEmail = inviterData?.email || '';
                            inviterName = inviterData?.displayName || inviterEmail;
                        }
                    } catch (e) {
                        console.error('Error fetching inviter:', e);
                    }
                }

                // Generate invitation link
                const invitationLink = data.token ? `${baseUrl}/register?invitation=${data.token}` : '';

                return {
                    id: doc.id,
                    email: data.email || '',
                    invitedBy: inviterId || '',
                    status: data.status || 'pending',
                    type: data.type || 'personal',
                    name: data.name || '',
                    usageCount: data.usageCount || 0,
                    token: data.token,
                    createdAt: data.createdAt?.toDate() || new Date(),
                    expiresAt: data.expiresAt?.toDate() || null,
                    inviterEmail,
                    inviterName,
                    acceptedAt: data.acceptedAt?.toDate(),
                    acceptedByName: data.acceptedByName,
                    invitationLink,
                } as InvitationWithDetails;
            })
        );

        // Sort by creation date descending
        invitations.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        return NextResponse.json({
            success: true,
            data: { invitations },
        });
    } catch (error) {
        console.error('Get Invitations Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch invitations' },
            { status: 500 }
        );
    }
}

// POST - Create new invitation (admin only)
// Supports both personal (email-based) and public (shareable link) invitations
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, type = 'public', name } = body;

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

        // For personal invitations, validate email
        if (type === 'personal' && email) {
            // Check if user already exists
            const usersSnapshot = await adminDb.collection('users')
                .where('email', '==', email)
                .limit(1)
                .get();

            if (!usersSnapshot.empty) {
                return NextResponse.json(
                    { success: false, error: 'User with this email already exists' },
                    { status: 400 }
                );
            }

            // Check if pending invitation already exists for this email
            const invitationsSnapshot = await adminDb.collection('invitations')
                .where('email', '==', email)
                .where('status', '==', 'pending')
                .limit(1)
                .get();

            if (!invitationsSnapshot.empty) {
                return NextResponse.json(
                    { success: false, error: 'Pending invitation already exists for this email' },
                    { status: 400 }
                );
            }
        }

        // Create invitation token
        const invitationToken = uuidv4();
        const now = new Date();

        // Generate invitation link
        // Use Vercel production URL (not preview), or configured base URL, or localhost for dev
        // Use custom domain for production, preview URL for non-prod Vercel, or localhost for dev
        const baseUrl = process.env.VERCEL_ENV === 'production'
            ? 'https://www.capscollective.ca'
            : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'));
        const invitationLink = `${baseUrl}/register?invitation=${invitationToken}`;

        // Create invitation document
        const invitationData: any = {
            invitedBy: userId,
            status: 'pending',
            type: type,
            token: invitationToken,
            createdAt: now,
            // Public links never expire, personal links now also never expire
            ...(type === 'personal' && email ? {
                email,
                // No expiresAt for personal links anymore
            } : {
                name: name || 'Public Invitation Link',
                usageCount: 0,
                // No expiresAt for public links - they never expire
            }),
        };

        const invitationRef = await adminDb.collection('invitations').add(invitationData);
        const invitationId = invitationRef.id;

        // For personal invitations, send email
        let emailSent = false;
        let emailError = null;

        if (type === 'personal' && email) {
            try {
                const transporter = nodemailer.createTransport({
                    host: process.env.SMTP_HOST,
                    port: Number(process.env.SMTP_PORT),
                    secure: process.env.SMTP_SECURE === 'true',
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASSWORD,
                    },
                });

                await transporter.sendMail({
                    from: process.env.SMTP_FROM || '"Caps Collective" <noreply@capscollective.com>',
                    to: email,
                    subject: "You're Invited to Join Caps Collective! 🎓",
                    html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Join Caps Collective</title>
                    </head>
                    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
                        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
                            <tr>
                                <td align="center">
                                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); overflow: hidden;">
                                        <tr>
                                            <td style="background: linear-gradient(135deg, #00245D 0%, #99D6EA 100%); padding: 40px 30px; text-align: center;">
                                                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Caps Collective</h1>
                                                <p style="margin: 10px 0 0 0; color: #ffffff; font-size: 16px; opacity: 0.9;">Community Connection Platform</p>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="padding: 40px 30px;">
                                                <h2 style="margin: 0 0 20px 0; color: #00245D; font-size: 24px; font-weight: 600;">You're Invited! 🎉</h2>
                                                <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">Hello!</p>
                                                <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                                                    You've been invited to join <strong>Caps Collective</strong>, a platform designed to connect community members, share skills, and collaborate on meaningful projects.
                                                </p>
                                                <p style="margin: 0 0 30px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                                                    Click the button below to create your account and get started:
                                                </p>
                                                <table width="100%" cellpadding="0" cellspacing="0">
                                                    <tr>
                                                        <td align="center" style="padding: 20px 0;">
                                                            <a href="${invitationLink}" style="display: inline-block; background-color: #00245D; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(0, 36, 93, 0.3);">
                                                                Accept Invitation
                                                            </a>
                                                        </td>
                                                    </tr>
                                                </table>
                                                <p style="margin: 30px 0 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                                                    Or copy and paste this link into your browser:
                                                </p>
                                                <p style="margin: 10px 0 0 0; color: #99D6EA; font-size: 14px; word-break: break-all;">
                                                    ${invitationLink}
                                                </p>

                                            </td>
                                        </tr>
                                        <tr>
                                            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                                                <p style="margin: 0; color: #666666; font-size: 14px;">
                                                    © ${new Date().getFullYear()} Caps Collective. All rights reserved.
                                                </p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </body>
                    </html>
                    `
                });
                emailSent = true;
                console.log('Invitation email sent via Nodemailer to:', email);
            } catch (e: any) {
                console.error('Failed to send invitation email:', e);
                emailError = e.message || 'Failed to send email';
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                id: invitationId,
                invitationLink,
                type,
                email: email || null,
                name: invitationData.name || null,
                expiresAt: invitationData.expiresAt || null,
                emailSent,
                emailError,
            },
        });
    } catch (error) {
        console.error('Create Invitation Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create invitation' },
            { status: 500 }
        );
    }
}

// PATCH - Update invitation status (resend, revoke)
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { invitationId, action } = body;

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

        const now = new Date();
        let updateFields: any = {
            updatedAt: now,
        };

        if (action === 'revoke') {
            updateFields.status = 'expired';
        } else if (action === 'resend') {
            // Only set new expiry for personal invitations
            const invDoc = await adminDb.collection('invitations').doc(invitationId).get();
            const invData = invDoc.data();
            if (invData?.type === 'personal') {
                // No expiry update on resend
            }
        }

        await adminDb.collection('invitations').doc(invitationId).update(updateFields);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update Invitation Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update invitation' },
            { status: 500 }
        );
    }
}

// DELETE - Delete a single invitation (admin only)
export async function DELETE(request: NextRequest) {
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

        const searchParams = request.nextUrl.searchParams;
        const invitationId = searchParams.get('invitationId');

        if (!invitationId) {
            return NextResponse.json(
                { success: false, error: 'Invitation ID required' },
                { status: 400 }
            );
        }

        await adminDb.collection('invitations').doc(invitationId).delete();

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete Invitation Error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete invitation' },
            { status: 500 }
        );
    }
}
