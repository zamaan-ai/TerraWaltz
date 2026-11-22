import { runNumericalTestVectors } from '../src/science/radarMath';

console.log('========================================================');
console.log('🛰️ RUNNING TERRAWALTZ NISAR RADAR & INSAR TEST SUITE');
console.log('========================================================\n');

const results = runNumericalTestVectors();
let passedCount = 0;

for (const r of results) {
  if (r.passed) {
    passedCount++;
    console.log(`✅ [PASS] ${r.name.padEnd(40)} -> Expected: ${r.expected} | Actual: ${r.actual}`);
  } else {
    console.error(`❌ [FAIL] ${r.name.padEnd(40)} -> Expected: ${r.expected} | Actual: ${r.actual}`);
  }
}

console.log('\n========================================================');
console.log(`📊 TEST RESULTS: ${passedCount}/${results.length} PASSED (${Math.round((passedCount / results.length) * 100)}%)`);
console.log('========================================================');

if (passedCount !== results.length) {
  process.exit(1);
}
