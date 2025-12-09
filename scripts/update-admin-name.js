/**
 * Script to update the admin user's display name
 * Updates both Firebase Auth and Firestore
 */

const admin = require('firebase-admin');
const serviceAccount = require('../caps-collective-firebase-adminsdk-fbsvc-538699c71d.json');

// Initialize Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'caps-collective',
});

const db = admin.firestore();
const auth = admin.auth();

const ADMIN_EMAIL = 'admin@capscollective.com';
const NEW_NAME = 'Admin';

async function updateAdminName() {
    console.log('============================================================');
    console.log('Admin Name Update Script');
    console.log('============================================================');
    console.log(`Email: ${ADMIN_EMAIL}`);
    console.log(`New Name: ${NEW_NAME}`);
    console.log('============================================================\n');

    try {
        // Step 1: Find user in Firebase Auth
        console.log('[Step 1] Finding user in Firebase Auth...');
        const userRecord = await auth.getUserByEmail(ADMIN_EMAIL);
        console.log(`✓ Found user with UID: ${userRecord.uid}`);
        console.log(`  Current display name: ${userRecord.displayName || '(not set)'}`);

        // Step 2: Update display name in Firebase Auth
        console.log('\n[Step 2] Updating display name in Firebase Auth...');
        await auth.updateUser(userRecord.uid, {
            displayName: NEW_NAME,
        });
        console.log(`✓ Firebase Auth display name updated to: ${NEW_NAME}`);

        // Step 3: Update name in Firestore user document
        console.log('\n[Step 3] Updating name in Firestore...');
        const userDocRef = db.collection('users').doc(userRecord.uid);
        const userDoc = await userDocRef.get();
        
        if (userDoc.exists) {
            await userDocRef.update({
                displayName: NEW_NAME,
                firstName: NEW_NAME,
                lastName: '',
                updatedAt: new Date(),
            });
            console.log('✓ Firestore user document updated');
        } else {
            console.log('⚠ User document not found in Firestore');
        }

        // Step 4: Verify the update
        console.log('\n[Step 4] Verifying update...');
        const updatedUser = await auth.getUser(userRecord.uid);
        console.log(`✓ Verified - New display name: ${updatedUser.displayName}`);

        console.log('\n============================================================');
        console.log('✓ SUCCESS! Admin name has been updated.');
        console.log('============================================================\n');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }

    process.exit(0);
}

updateAdminName();

