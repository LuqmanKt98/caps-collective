// Script to update admin user's email in Firebase Auth and Firestore
// Run with: node scripts/update-admin-email.js

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Configuration
const OLD_EMAIL = 'luqman.haider01@gmail.com';
const NEW_EMAIL = 'admin@capscollective.com';

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'caps-collective-firebase-adminsdk-fbsvc-538699c71d.json');

if (!fs.existsSync(serviceAccountPath)) {
    console.error('Service account file not found:', serviceAccountPath);
    console.error('Please ensure the Firebase service account JSON file exists.');
    process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'caps-collective',
    });
}

const db = admin.firestore();
const auth = admin.auth();

async function updateAdminEmail() {
    console.log('='.repeat(60));
    console.log('Admin Email Update Script');
    console.log('='.repeat(60));
    console.log(`Old Email: ${OLD_EMAIL}`);
    console.log(`New Email: ${NEW_EMAIL}`);
    console.log('='.repeat(60));

    try {
        // Step 1: Get user by current email
        console.log('\n[Step 1] Finding user in Firebase Auth...');
        let userRecord;
        try {
            userRecord = await auth.getUserByEmail(OLD_EMAIL);
            console.log(`✓ Found user with UID: ${userRecord.uid}`);
            console.log(`  Current email: ${userRecord.email}`);
            console.log(`  Email verified: ${userRecord.emailVerified}`);
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                console.error(`✗ User with email ${OLD_EMAIL} not found in Firebase Auth`);
                process.exit(1);
            }
            throw error;
        }

        // Step 2: Update email in Firebase Auth
        console.log('\n[Step 2] Updating email in Firebase Auth...');
        await auth.updateUser(userRecord.uid, {
            email: NEW_EMAIL,
            emailVerified: true, // Keep email verified
        });
        console.log(`✓ Firebase Auth email updated to: ${NEW_EMAIL}`);

        // Step 3: Update email in Firestore user document
        console.log('\n[Step 3] Updating email in Firestore...');
        const userDocRef = db.collection('users').doc(userRecord.uid);
        const userDoc = await userDocRef.get();

        if (userDoc.exists) {
            await userDocRef.update({
                email: NEW_EMAIL,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            console.log(`✓ Firestore user document updated`);
        } else {
            console.log(`⚠ No Firestore user document found for UID: ${userRecord.uid}`);
        }

        // Step 4: Verify the update
        console.log('\n[Step 4] Verifying update...');
        const updatedUser = await auth.getUser(userRecord.uid);
        console.log(`✓ Verified - New email: ${updatedUser.email}`);

        console.log('\n' + '='.repeat(60));
        console.log('✓ SUCCESS! Admin email has been updated.');
        console.log('='.repeat(60));
        console.log('\nYou can now log in with:');
        console.log(`  Email: ${NEW_EMAIL}`);
        console.log(`  Password: (unchanged)`);
        console.log('='.repeat(60));

        process.exit(0);
    } catch (error) {
        console.error('\n✗ ERROR:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    }
}

updateAdminEmail();

