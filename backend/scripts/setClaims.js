/**
 * setClaims.js
 *
 * Sets Firebase custom claims (role) on existing Firebase Auth users.
 * Run this after creating users in Firebase Console or via the seed script.
 *
 * Usage:  node scripts/setClaims.js
 *
 * Requires: serviceAccountKey.json (or env vars) in backend/
 */

require('dotenv').config({ path: '../.env' });
const { auth } = require('../firebaseAdmin');

const USERS = [
    { email: 'admin@campus.edu', role: 'admin', department: null },
    { email: 'finance@campus.edu', role: 'finance', department: null },
    { email: 'inventory@campus.edu', role: 'inventory', department: null },
    { email: 'head@campus.edu', role: 'department', department: 'Computer Science' },
    { email: 'auditor@campus.edu', role: 'auditor', department: null },
    { email: 'director@campus.edu', role: 'executive', department: null },
];

async function main() {
    console.log('\n🔑 Setting custom claims on Firebase users...\n');
    let ok = 0, fail = 0;

    for (const u of USERS) {
        try {
            const record = await auth.getUserByEmail(u.email);
            await auth.setCustomUserClaims(record.uid, {
                role: u.role,
                department: u.department,
            });
            console.log(`   ✅  ${u.email}  →  role: ${u.role}`);
            ok++;
        } catch (e) {
            console.warn(`   ❌  ${u.email}: ${e.message}`);

            // If user doesn't exist yet, create them now and set claims
            if (e.code === 'auth/user-not-found') {
                try {
                    console.log(`       Creating user ${u.email}...`);
                    const newRecord = await auth.createUser({
                        email: u.email,
                        password: 'Campus@123',
                        displayName: u.email.split('@')[0],
                    });
                    await auth.setCustomUserClaims(newRecord.uid, {
                        role: u.role,
                        department: u.department,
                    });
                    console.log(`   ✅  Created + claims set for ${u.email}`);
                    ok++;
                } catch (createErr) {
                    console.error(`   ❌  Could not create ${u.email}: ${createErr.message}`);
                    fail++;
                }
            } else {
                fail++;
            }
        }
    }

    console.log(`\n✅ Done. ${ok} succeeded, ${fail} failed.\n`);

    if (ok > 0) {
        console.log('⚠️  IMPORTANT: Users must sign out and sign back in for');
        console.log('   the new claims to take effect in their ID token.\n');
    }

    process.exit(fail > 0 ? 1 : 0);
}

main();
