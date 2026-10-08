// Password-recovery helper for a bcrypt hash (one-way hash -> only guessing).
// Usage: node bcrypt-recover2.js [wordlistFile ...]
const bcrypt = require('bcrypt');
const fs = require('fs');

const HASH = '$2b$10$P2Ku9CxDGjnLSLyVPTi43O1TsUbR7A2osyv0m4HfK.vmPfSkPNQCS';

// Account: danielgd / daniel gelan / danielgd@example.com
const targeted = [
  // username-based
  'danielgd', 'Danielgd', 'DANIELGD', 'danielgd1', 'danielgd12', 'danielgd123', 'danielgd1234',
  'Danielgd123', 'danielgd!', 'danielgd@', 'danielgd#', 'danielgd@123', 'Danielgd@123',
  'danielgd2023', 'danielgd2024', 'danielgd2025', 'danielgd2026', 'danielgd@2024', 'danielgd@2025', 'danielgd@2026',
  'danielgd@example.com', 'danielgd88', 'danielgd588', 'danielgd22', 'danielgd01',
  'D@nielgd', 'D@nielgd123', 'd4nielgd', 'danielg', 'danielgd!', 'dg123', 'DG123', 'dgd123',
  // first name
  'daniel', 'Daniel', 'DANIEL', 'daniel1', 'daniel12', 'daniel123', 'daniel1234', 'daniel12345',
  'Daniel1', 'Daniel12', 'Daniel123', 'Daniel1234', 'Daniel123!', 'Daniel@123', 'daniel@123',
  'daniel!', 'daniel@', 'daniel#1', 'daniel2023', 'daniel2024', 'daniel2025', 'daniel2026',
  'Daniel2024!', 'Daniel2025!', 'Daniel2026!', 'd@niel', 'd@niel123', 'D@niel123', 'd4niel', 'd4niel123',
  'dan123', 'dan1234', 'danie123', 'dani1234',
  // last name
  'gelan', 'Gelan', 'GELAN', 'gelan123', 'Gelan123', 'gelan1234', 'gelan2024', 'gelan2025', 'gelan2026', 'gelan!', 'gelan@123',
  'Gelan@123', 'g3lan', 'gelan88', 'gelan588',
  // full name variants
  'danielgelan', 'DanielGelan', 'DanielGelan123', 'danielgelan123', 'daniel_gelan', 'daniel.gelan',
  'daniel-gelan', 'daniel gelan', 'Daniel Gelan', 'danielgelan2024', 'danielgelan2025', 'danielgelan2026',
  'gelaniel', 'd_gelan', 'dg2024', 'dg2025', 'dg2026',
  // phone
  '0911234588', '251911234588', '911234588', '911234567', '0911234567',
  // generic re-tries with suffixes
  'password123', 'Password123!', 'Admin123', 'admin123', 'Welcome123', 'Qwerty123',
  'P@ssw0rd123', 'ChangeMe123', 'Test1234', 'Test@1234',
  // short pins / digits (login does not enforce the 6-char creation rule)
  '123456', '1234567', '12345678', '123456789', '111111', '000000', '59112116',
];

const lists = process.argv.slice(2);
const all = [...targeted];
for (const f of lists) {
  try {
    const lines = fs.readFileSync(f, 'utf8').split(/\r?\n/);
    for (const l of lines) {
      const w = l.trim();
      if (w) all.push(w);
    }
  } catch (e) {
    console.log('WARN: cannot read ' + f + ': ' + e.message);
  }
}
const uniq = [...new Set(all)];

(async () => {
  try {
    console.log('Hash valid: bcrypt cost = ' + bcrypt.getRounds(HASH) + ', candidates = ' + uniq.length);
  } catch (e) {
    console.log('INVALID HASH FORMAT: ' + e.message);
    process.exit(1);
  }

  const start = Date.now();
  let idx = 0;
  let checked = 0;
  let found = null;

  async function worker() {
    while (idx < uniq.length && !found) {
      const c = uniq[idx++];
      try {
        if (await bcrypt.compare(c, HASH)) {
          if (!found) found = c;
          return;
        }
      } catch (e) {
        // ignore individual compare errors
      }
      checked++;
      if (checked % 2000 === 0) {
        console.log('  ...' + checked + ' checked (' + ((Date.now() - start) / 1000).toFixed(0) + 's)');
      }
    }
  }

  await Promise.all(Array.from({ length: 6 }, () => worker()));

  const secs = ((Date.now() - start) / 1000).toFixed(1);
  if (found) {
    console.log('MATCH FOUND after ' + secs + 's -> PASSWORD: [' + found + ']');
  } else {
    console.log('NO MATCH among ' + uniq.length + ' candidates (' + secs + 's)');
  }
  process.exit(found ? 0 : 2);
})();
