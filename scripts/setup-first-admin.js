// Script to create the first admin user using Firebase Admin SDK
// Run with: node scripts/setup-first-admin.js

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'caps-collective-firebase-adminsdk-fbsvc-538699c71d.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'caps-collective',
    });
}

const db = admin.firestore();
const auth = admin.auth();

async function setupFirstAdmin() {
    const email = 'admin@capscollective.com';
    const password = 'Test@123';

    try {
        // Check if user already exists in Firebase Auth
        let userRecord;
        try {
            userRecord = await auth.getUserByEmail(email);
            console.log('User already exists in Firebase Auth:', userRecord.uid);
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                // Create the user
                userRecord = await auth.createUser({
                    email: email,
                    password: password,
                    emailVerified: true,
                });
                console.log('Created new user in Firebase Auth:', userRecord.uid);
            } else {
                throw error;
            }
        }

        // Check if user document exists in Firestore
        const userDoc = await db.collection('users').doc(userRecord.uid).get();

        if (userDoc.exists) {
            // Update existing user to be primary admin
            await db.collection('users').doc(userRecord.uid).update({
                isAdmin: true,
                isPrimaryAdmin: true,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            console.log('Updated existing user to be primary admin');
        } else {
            // Create user document
            await db.collection('users').doc(userRecord.uid).set({
                email: email,
                displayName: 'Admin',
                isAdmin: true,
                isPrimaryAdmin: true,
                onboardingComplete: true,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            console.log('Created user document as primary admin');
        }

        console.log('\n✅ Admin setup complete!');
        console.log('Email:', email);
        console.log('Password:', password);
        console.log('UID:', userRecord.uid);

    } catch (error) {
        console.error('Error setting up admin:', error);
        process.exit(1);
    }

    process.exit(0);
}

setupFirstAdmin();
