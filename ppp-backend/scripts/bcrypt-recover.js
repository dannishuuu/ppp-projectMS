// Temporary password-recovery helper: tests candidate passwords against a
// bcrypt hash using the same bcrypt lib the app uses (one-way hash -> only
// guessing/verification is possible, not decryption).
const bcrypt = require('bcrypt');

const HASH = '$2b$10$P2Ku9CxDGjnLSLyVPTi43O1TsUbR7A2osyv0m4HfK.vmPfSkPNQCS';

const candidates = [
  // ---- contextual: this machine / project / user ----
  '59112116', '59112116!', '59112116#', '16111955', '11211659',
  'dani', 'dani123', 'Dani123', 'Dani@123', 'daniel', 'Daniel123', 'Daniele123',
  'takele', 'takeleu', 'takeleuma', 'takele123', 'Takele123', 'Takele@123', 'TakeleUma', 'TakeleUma123', 'takeleuma123', 'uma123', 'Uma123',
  'admin', 'admin123', 'Admin123', 'Admin1234', 'admin@123', 'Admin@123', 'administrator', 'Administrator1', 'admin1234', 'Admin1!',
  'addis', 'addis123', 'Addis123', 'addisababa', 'AddisAbaba', 'AddisAbaba123', 'Addis@123', 'AddisAbaba2024', 'AddisAbaba2025', 'AddisAbaba2026',
  'ethiopia', 'Ethiopia123', 'Ethiopia@123', 'AddisAbaba2016',
  'corridor', 'Corridor123', 'Corridor@123', 'corridor123',
  'aappp', 'AAPPP123', 'Aappp123', 'ppp', 'ppp123', 'PPP123', 'Ppp@123', 'ppp2024', 'ppp2025', 'ppp2026',
  'cbr', 'cbr123', 'CBR123', 'cbrportal', 'CBRPortal123', 'cbr@123',
  'kaleb', 'Kaleb123', 'samuel', 'Samuel123', 'girma', 'Girma123', 'abebe', 'Abebe123',
  // ---- common / top lists ----
  'password', 'password1', 'Password1', 'Password123', 'Password123!', 'password123', 'password1234', 'P@ssw0rd', 'P@ssword1', 'p@ssw0rd',
  '123456', '1234567', '12345678', '123456789', '1234567890', '12345678900', '123456789000',
  'qwerty', 'qwerty123', 'qwertyuiop', 'Qwerty123', 'q1w2e3r4', '1q2w3e4r', '1q2w3e4r5t', 'zaq12wsx',
  '111111', '000000', '11111111', '00000000', '123123', '121212', '654321', '987654321', '112233', '12341234', '11112222', '696969', '100200', '555555', '888888', '7777777',
  'iloveyou', 'princess', 'sunshine', 'monkey', 'dragon', 'master', 'shadow', 'superman', 'trustno1', 'batman', 'football', 'baseball', 'starwars',
  'letmein', 'welcome', 'welcome1', 'Welcome1', 'Welcome123', 'welcometoyou', 'login', 'pass', 'pass123', 'passw0rd',
  'abc123', 'abcd1234', 'abcdefg', 'aaaaaa', 'abc12345', 'aaa123', 'monkey123', 'charlie', 'donald', 'whatever', 'freedom', 'hello123',
  'test', 'test123', 'test1234', 'Test1234', 'testing123', 'guest', 'user', 'user123', 'root', 'root123', 'toor', 'mysql', 'postgres',
  'changeme', 'ChangeMe123', 'ChangeMe1!', 'temppassword', 'Temp1234', 'default', 'secret', 'secret123',
  '!@#$%^&*', 'iloveyou1', 'football123', 'pokemon', 'naruto', 'jordan23', 'michael', 'jennifer', 'hunter', 'ranger', 'buster',
  'summer2024', 'summer2025', 'winter2024', 'winter2025', 'spring2024', 'autumn2024', 'january', 'february',
  'admin@2024', 'admin@2025', 'admin@2026', 'Admin@2024', 'Admin@2025', 'Admin@2026', 'Password@2024', 'Password@2025', 'Password@2026',
  '2000', '2001', '2002', '2003', '2004', '2005', '2006', '2007', '2008', '2009', '2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026',
  '1234a', '12345a', 'a12345', 'a123456', 'aaaa1234', 'qazwsx', 'qwe123', 'qweasd', 'qweasdzxc', 'asdfgh', 'asdfghjkl', 'zxcvbnm',
  'love', 'lovely', 'lovers', 'forever', 'family', 'friends', 'friend123',
  'computer', 'internet', 'samsung', 'google', 'facebook', 'linkedin', 'whatsapp',
  'coffee', 'chocolate', 'flower', 'butterfly', 'diamond', 'ginger', 'pepper',
  'nigeria', 'ghana', 'kenya', 'london', 'africa', 'america',
  '123qwe', '123qweasd', 'q1w2e3r4t5', 'asd123', 'asdasd', 'asdasd123',
  'letmein123', 'passion', 'summer', 'winter', 'spring', 'autumn',
  'joshua', 'matthew', 'andrew', 'daniel1', 'thomas', 'robert', 'william',
  'amanda', 'jessica', 'charlotte', 'michelle', 'sarah', 'sarah123',
  'password12', 'Password12', 'Password1234', 'P4ssw0rd', 'P4ssword',
  'admin1', 'admin12', 'adm1n', 'root1234', 'toor123', 'pass12', 'test1',
  'newpassword', 'newpassword1', 'mypassword', 'mypassword1',
  'company123', 'business123', 'office123', 'manager123', 'director123',
  'qwerty1', 'qwerty12', 'qwerty1234', '1234abcd', 'abcd1234!', 'welcome123',
];

const uniq = [...new Set(candidates)];

(async () => {
  try {
    const rounds = bcrypt.getRounds(HASH);
    console.log('Hash valid: bcrypt cost = ' + rounds + ', candidates = ' + uniq.length);
  } catch (e) {
    console.log('INVALID HASH FORMAT: ' + e.message);
    process.exit(1);
  }

  const start = Date.now();
  let idx = 0;
  let found = null;

  async function worker() {
    while (idx < uniq.length && !found) {
      const c = uniq[idx++];
      try {
        const ok = await bcrypt.compare(c, HASH);
        if (ok && !found) {
          found = c;
          return;
        }
      } catch (e) {
        // ignore individual compare errors
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
