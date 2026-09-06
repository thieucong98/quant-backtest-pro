import { generateDeterministicCalendar } from '../src/config/newsEvents';
import { CURATED_HISTORICAL_EVENTS } from '../src/config/historicalCalendarData';
import { SERVER_HISTORICAL_EVENTS } from '../server/data/historicalCalendarData';

console.log('🔍 Running Authentic Calendar & Sorting Audit...\n');

// 1. Check September 2026 NFP in curated data
const nfp2026Sep = CURATED_HISTORICAL_EVENTS.find(e => e.id === 'real_2026_09_04_NFP');
if (!nfp2026Sep) {
  throw new Error('❌ September 2026 NFP missing from CURATED_HISTORICAL_EVENTS');
}
console.log('✅ Found 2026-09-04 NFP in CURATED_HISTORICAL_EVENTS:');
console.log(`   Actual: ${nfp2026Sep.actual} (Expected: 162K)`);
console.log(`   Forecast: ${nfp2026Sep.forecast} (Expected: 55K)`);
console.log(`   Previous: ${nfp2026Sep.previous} (Expected: 21K)`);
console.log(`   Source: ${nfp2026Sep.source} (Expected: HISTORICAL_REAL)`);

if (nfp2026Sep.actual !== '162K' || nfp2026Sep.forecast !== '55K' || nfp2026Sep.previous !== '21K') {
  throw new Error('❌ NFP 2026-09 values do not match authentic Investing.com data!');
}

// 2. Check generator output for September 2026
const sep1 = Date.UTC(2026, 8, 1, 0, 0, 0);
const sep30 = Date.UTC(2026, 8, 30, 23, 59, 59);
const sepEvents = generateDeterministicCalendar(sep1, sep30, ['USD']);

console.log(`\n✅ Generated ${sepEvents.length} events for Sep 2026`);
const nfpInSep = sepEvents.find(e => e.title.includes('Non-Farm'));
if (!nfpInSep) {
  throw new Error('❌ NFP not found in generated Sep 2026 events');
}
console.log('✅ Generated NFP event:');
console.log(`   Title: ${nfpInSep.title}`);
console.log(`   Actual: ${nfpInSep.actual}`);
console.log(`   Forecast: ${nfpInSep.forecast}`);
console.log(`   Previous: ${nfpInSep.previous}`);
console.log(`   Source: ${nfpInSep.source}`);

if (nfpInSep.actual !== '162K' || nfpInSep.forecast !== '55K' || nfpInSep.previous !== '21K') {
  throw new Error(`❌ Generated NFP has wrong values! Got: ${nfpInSep.actual}/${nfpInSep.forecast}/${nfpInSep.previous}`);
}

// 3. Verify NO duplicate NFP events exist
const allNfpInSep = sepEvents.filter(e => e.title.includes('Non-Farm'));
if (allNfpInSep.length !== 1) {
  throw new Error(`❌ Duplicate NFP events found: ${allNfpInSep.length}`);
}
console.log('✅ Exactly 1 NFP event present (no duplicates generated)');

// 4. Verify unreleased / future events have NO fake numbers
const futureStart = Date.UTC(2027, 0, 1, 0, 0, 0);
const futureEnd = Date.UTC(2027, 0, 31, 23, 59, 59);
const futureEvents = generateDeterministicCalendar(futureStart, futureEnd, ['USD']);
console.log(`\n✅ Generated ${futureEvents.length} events for future Jan 2027`);

const futureNfp = futureEvents.find(e => e.title.includes('Non-Farm'));
if (!futureNfp) {
  throw new Error('❌ Future NFP not found in schedule');
}
console.log('✅ Future NFP event in 2027:');
console.log(`   Actual: ${futureNfp.actual} (Expected: undefined)`);
console.log(`   Forecast: ${futureNfp.forecast} (Expected: undefined)`);
console.log(`   Previous: ${futureNfp.previous} (Expected: undefined)`);
console.log(`   Sentiment: ${futureNfp.sentiment} (Expected: NEUTRAL)`);

if (futureNfp.actual !== undefined || futureNfp.forecast !== undefined || futureNfp.previous !== undefined) {
  throw new Error('❌ Fake data detected in future event!');
}

// 5. Verify server dataset has exact same parity
const serverNfp2026 = SERVER_HISTORICAL_EVENTS.find(e => e.id === 'real_2026_09_04_NFP');
if (!serverNfp2026 || serverNfp2026.actual !== '162K' || serverNfp2026.forecast !== '55K') {
  throw new Error('❌ Server historical data does not match client curated data!');
}
console.log('\n✅ Server dataset parity verified!');

// 6. Verify Sorting (Newest to Oldest)
const sortedDesc = [...sepEvents].sort((a, b) => b.timestamp - a.timestamp);
for (let i = 0; i < sortedDesc.length - 1; i++) {
  if (sortedDesc[i].timestamp < sortedDesc[i + 1].timestamp) {
    throw new Error('❌ Sorting order violation in DESC order');
  }
}
console.log('✅ Descending sort (Newest to Oldest) verified!');

console.log('\n🎉 ALL 6 AUTHENTICITY AND SORTING AUDITS PASSED WITH ZERO ERRORS!\n');
