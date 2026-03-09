/**
 * fixRoles.js
 * Lists all users in Firestore and lets you fix their roles.
 *
 * Run from backend/ directory:
 *   node scripts/fixRoles.js          ← shows current roles
 *   node scripts/fixRoles.js --fix    ← updates roles based on email patterns
 */

process.chdir(__dirname + '/..');
require('dotenv').config({ path: '.env' });

const { db, auth } = require('../firebaseAdmin');

// ── Role mapping: email pattern → role ───────────────────────────────────────
// Edit this to match your actual user emails
const EMAIL_TO_ROLE = {
    'admin': 'admin',
    'finance': 'finance',
    'inventory': 'inventory',
    'department': 'department',
    'dept': 'department',
    'head': 'department',
    'auditor': 'auditor',
    'executive': 'executive',
    'exec': 'executive',
};

function guessRole(email = '') {
    const local = email.split('@')[0].toLowerCase();
    for (const [keyword, role] of Object.entries(EMAIL_TO_ROLE)) {
        if (local.includes(keyword)) return role;
    }
    return null; // can't guess
}

async function main() {
    const shouldFix = process.argv.includes('--fix');
    console.log(`\n=== CITIL User Role Inspector ${shouldFix ? '(FIX MODE)' : '(READ-ONLY)'} ===\n`);

    // 1. List Firebase Auth users
    let authUsers = [];
    try {
        const listResult = await auth.listUsers(1000);
        authUsers = listResult.users;
    } catch (e) {
        console.warn('Could not list Firebase Auth users:', e.message);
    }

    // 2. Read Firestore users collection
    const snap = await db.collection('users').get();
    const firestoreDocs = {};
    snap.docs.forEach(doc => { firestoreDocs[doc.id] = doc.data(); });

    console.log(`Firebase Auth users: ${authUsers.length}`);
    console.log(`Firestore user docs: ${Object.keys(firestoreDocs).length}\n`);

    const rows = [];

    // Merge both sources
    const allUids = new Set([
        ...authUsers.map(u => u.uid),
        ...Object.keys(firestoreDocs),
    ]);

    for (const uid of allUids) {
        const authUser = authUsers.find(u => u.uid === uid);
        const fsDoc = firestoreDocs[uid];
        const email = authUser?.email || fsDoc?.email || '—';
        const claimsRole = authUser?.customClaims?.role || null;
        const fsRole = fsDoc?.role || null;
        const effectiveRole = claimsRole || fsRole || 'department (default)';
        const guessed = guessRole(email);

        rows.push({ uid, email, claimsRole, fsRole, effectiveRole, guessed });
    }

    // Print table
    console.log('UID                          | Email                      | Claims Role | Firestore Role | Effective   | Should Be');
    console.log('-'.repeat(115));
    for (const r of rows) {
        const mismatch = r.guessed && r.guessed !== (r.claimsRole || r.fsRole);
        console.log(
            `${r.uid.padEnd(28)} | ${r.email.padEnd(26)} | ${(r.claimsRole || '—').padEnd(11)} | ${(r.fsRole || '—').padEnd(14)} | ${r.effectiveRole.padEnd(11)} | ${r.guessed || '?'} ${mismatch ? '⚠️  MISMATCH' : ''}`
        );
    }

    if (!shouldFix) {
        console.log('\n⚡ Run with --fix to update Firestore roles and Firebase custom claims');
        console.log('   node scripts/fixRoles.js --fix\n');
        process.exit(0);
    }

    // ── FIX MODE ──────────────────────────────────────────────────────────────
    console.log('\n--- Applying fixes ---\n');

    for (const r of rows) {
        if (!r.guessed) {
            console.log(`⏭  ${r.email} — could not guess role, skipping`);
            continue;
        }
        if (r.claimsRole === r.guessed && r.fsRole === r.guessed) {
            console.log(`✅  ${r.email} — already correct (${r.guessed})`);
            continue;
        }

        try {
            // Update Firestore
            await db.collection('users').doc(r.uid).set(
                { role: r.guessed, updatedAt: new Date().toISOString() },
                { merge: true }
            );

            // Update Firebase custom claims
            try {
                await auth.setCustomUserClaims(r.uid, {
                    ...(r.claimsRole ? {} : {}),
                    role: r.guessed,
                    department: firestoreDocs[r.uid]?.department || null,
                });
                console.log(`✅  ${r.email} → role set to '${r.guessed}' (Firestore + custom claims)`);
            } catch (claimErr) {
                console.log(`✅  ${r.email} → role set to '${r.guessed}' (Firestore only — claims failed: ${claimErr.message})`);
            }
        } catch (e) {
            console.error(`❌  ${r.email} — failed: ${e.message}`);
        }
    }

    console.log('\n✨ Done! Users must sign out and sign back in for new claims to take effect.\n');
    process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
