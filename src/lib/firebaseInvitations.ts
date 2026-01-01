import admin from 'firebase-admin';
import { getApps, initializeApp } from 'firebase-admin/app';

// Ensure Firebase Admin is initialized (already done in firebaseAdmin.ts)
if (!admin.apps.length) {
    // This will use GOOGLE_APPLICATION_CREDENTIALS env var
    initializeApp();
}

/**
 * Sends an invitation email using Firebase Admin SDK to generate a sign‑in link.
 * The project must have Email/Password sign‑in enabled and the "Email link"
 * method turned on.
 *
 * @param email The invitee's email address.
 * @returns An object containing the generated link and a flag indicating
 *          whether the email was sent successfully (the link is returned;
 *          actual email delivery is handled by the caller, e.g., via Nodemailer).
 */
export async function sendFirebaseInvitation(email: string) {
    try {
        // Use Vercel URL in production, or configured base URL, or localhost for dev
        const baseUrl = process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

        const actionCodeSettings = {
            // URL to redirect after sign‑in. Use NEXT_PUBLIC_BASE_URL.
            url: `${baseUrl}/register?email=${encodeURIComponent(email)}`,
            handleCodeInApp: true,
        };

        // Generate the sign‑in link using the Admin SDK
        const invitationLink = await admin
            .auth()
            .generateSignInWithEmailLink(email, actionCodeSettings);

        // The caller can now send the email using any email service.
        return { invitationLink, emailSent: true };
    } catch (error: any) {
        console.error('Firebase invitation error:', error);
        return { invitationLink: '', emailSent: false, error: error.message };
    }
}
