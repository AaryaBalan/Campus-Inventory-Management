/**
 * seedUsers.js
 * Creates Firestore user documents with correct roles.
 * The Firestore 'users' collection was empty, causing everyone to default to 'department' role.
 *
 * HOW TO USE:
 * 1. Fill in the USERS array below with the email, uid, role for each of your Firebase Auth users.
 *    To find UIDs: go to Firebase Console → Authentication → Users tab
 * 2. Run: node scripts/seedUsers.js
 */

process.chdir(__dirname + '/..');
require('dotenv').config({ path: '.env' });

const { db } = require('../firebaseAdmin');

// ────────────────────────────────────────────────────────────────────
// EDIT THIS LIST with your real Firebase Auth UIDs and emails
// Go to: https://console.firebase.google.com → Your Project → Authentication → Users
// ────────────────────────────────────────────────────────────────────
const USERS = [
    { email: 'admin@campus.edu', role: 'admin', name: 'Admin User', department: null },
    { email: 'finance@campus.edu', role: 'finance', name: 'Finance Team', department: 'Finance' },
    { email: 'inventory@campus.edu', role: 'inventory', name: 'Inventory Manager', department: 'Stores' },
    { email: 'dept@campus.edu', role: 'department', name: 'Department Head', department: 'Science' },
    { email: 'auditor@campus.edu', role: 'auditor', name: 'Internal Auditor', department: null },
    { email: 'executive@campus.edu', role: 'executive', name: 'Executive Director', department: null },
    // Add more users here if needed:
    // { email: 'someone@campus.edu', role: 'finance', name: 'Someone', department: 'Finance' },
];

async function main() {
    console.log('\n=== Seeding Firestore users collection ===\n');
    console.log('NOTE: UIDs will be matched by querying Firebase Auth by email.');
    console.log('If Auth API is blocked, documents will be created with email as the doc ID.\n');

    const { auth } = require('../firebaseAdmin');

    for (const user of USERS) {
        try {
            // Try to get real UID from Firebase Auth
            let uid;
            try {
                const authUser = await auth.getUserByEmail(user.email);
                uid = authUser.uid;
                console.log(`✅ Found Firebase Auth user: ${user.email} → uid: ${uid}`);
            } catch (authErr) {
                // If Auth lookup fails, use email as the Firestore doc ID (less ideal but workable)
                uid = user.email.replace(/[^a-zA-Z0-9]/g, '_');
                console.log(`⚠️  Auth lookup failed for ${user.email}, using email-based ID: ${uid}`);
            }

            const doc = {
                uid,
                email: user.email,
                name: user.name,
                role: user.role,
                department: user.department,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isActive: true,
            };

            await db.collection('users').doc(uid).set(doc, { merge: true });
            console.log(`   ↳ Firestore users/${uid} created with role='${user.role}'`);

            // Try to set custom claims too
            if (uid && !uid.includes('@')) {
                try {
                    await auth.setCustomUserClaims(uid, {
                        role: user.role,
                        department: user.department,
                    });
                    console.log(`   ↳ Firebase custom claims set: role='${user.role}'`);
                } catch (claimsErr) {
                    console.log(`   ↳ Custom claims skipped (Identity Toolkit API not enabled)`);
                }
            }
        } catch (e) {
            console.error(`❌ Failed for ${user.email}: ${e.message}`);
        }
    }

    console.log('\n✨ Done! Sign out and sign back in for roles to take effect.\n');
    process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
