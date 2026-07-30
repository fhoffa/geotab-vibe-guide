'use strict';
/**
 * Test suite for Animal Speed Map pure functions.
 *
 * Run with:  node tests/animal-speed-map/test.js
 * Or:        bash tests/animal-speed-map/run.sh
 *
 * No external dependencies — uses only Node.js built-ins.
 */

const path = require('path');
const { getAnimalEmoji, buildStatusLookup, buildDeviceIndex, filterMappable, buildRowData } =
  require(path.join(__dirname, '../../examples/addins/animal-speed-map.js'));

// ---------------------------------------------------------------------------
// Minimal test runner
// ---------------------------------------------------------------------------

let _passed = 0;
let _failed = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`  ✓  ${description}`);
    _passed++;
  } catch (e) {
    console.log(`  ✗  ${description}`);
    console.log(`       ${e.message}`);
    _failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(
      `${label || 'assertEqual'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
  }
}

function assertDeepEqual(actual, expected, label) {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) {
    throw new Error(`${label || 'assertDeepEqual'}:\n  expected: ${b}\n  got:      ${a}`);
  }
}

// ---------------------------------------------------------------------------
// getAnimalEmoji
// ---------------------------------------------------------------------------

console.log('\ngetAnimalEmoji — speed-to-animal mapping');

test('speed 0 → sleeping (💤)', () => {
  assertEqual(getAnimalEmoji(0), '💤');
});

test('speed 1 → snail (🐌)', () => {
  assertEqual(getAnimalEmoji(1), '🐌');
});

test('speed 20 → snail boundary (🐌)', () => {
  assertEqual(getAnimalEmoji(20), '🐌');
});

test('speed 21 → turtle (🐢)', () => {
  assertEqual(getAnimalEmoji(21), '🐢');
});

test('speed 50 → turtle boundary (🐢)', () => {
  assertEqual(getAnimalEmoji(50), '🐢');
});

test('speed 51 → horse (🐎)', () => {
  assertEqual(getAnimalEmoji(51), '🐎');
});

test('speed 90 → horse boundary (🐎)', () => {
  assertEqual(getAnimalEmoji(90), '🐎');
});

test('speed 91 → cheetah (🐆)', () => {
  assertEqual(getAnimalEmoji(91), '🐆');
});

test('speed 130 → cheetah (🐆)', () => {
  assertEqual(getAnimalEmoji(130), '🐆');
});

test('returns a non-empty string for any numeric input', () => {
  [0, 5, 20, 50, 90, 200].forEach(function(s) {
    const result = getAnimalEmoji(s);
    assert(typeof result === 'string' && result.length > 0, `No emoji for speed ${s}`);
  });
});

// ---------------------------------------------------------------------------
// buildStatusLookup
// ---------------------------------------------------------------------------

console.log('\nbuildStatusLookup — index statuses by device id');

const sampleStatuses = [
  { device: { id: 'b1' }, speed: 55, latitude: 43.6, longitude: -79.4 },
  { device: { id: 'b2' }, speed: 0,  latitude: 43.7, longitude: -79.5 },
  { device: { id: 'b3' }, speed: 15, latitude: 43.8, longitude: -79.3 }
];

test('returns object keyed by device id', () => {
  const lookup = buildStatusLookup(sampleStatuses);
  assert('b1' in lookup, 'b1 missing');
  assert('b2' in lookup, 'b2 missing');
  assert('b3' in lookup, 'b3 missing');
});

test('preserves the full status record', () => {
  const lookup = buildStatusLookup(sampleStatuses);
  assertEqual(lookup['b1'].speed, 55);
  assertEqual(lookup['b2'].latitude, 43.7);
});

test('empty input → empty object', () => {
  assertDeepEqual(buildStatusLookup([]), {});
});

test('skips entries missing device.id', () => {
  const messy = [
    { device: { id: 'x1' }, speed: 10 },
    { device: {}, speed: 20 },          // no id
    { speed: 30 },                       // no device
    null                                 // null entry
  ];
  const lookup = buildStatusLookup(messy);
  assert('x1' in lookup, 'x1 should be present');
  assertEqual(Object.keys(lookup).length, 1, 'only one valid entry');
});

test('last entry wins for duplicate device ids', () => {
  const dupes = [
    { device: { id: 'd1' }, speed: 10 },
    { device: { id: 'd1' }, speed: 99 }
  ];
  assertEqual(buildStatusLookup(dupes)['d1'].speed, 99);
});

// ---------------------------------------------------------------------------
// buildDeviceIndex
// ---------------------------------------------------------------------------

console.log('\nbuildDeviceIndex — index device names by id');

const sampleDevices = [
  { id: 'b1', name: 'Truck Alpha' },
  { id: 'b2', name: 'Van Beta' },
  { id: 'b3', name: 'Car Gamma' }
];

test('returns object keyed by device id', () => {
  const idx = buildDeviceIndex(sampleDevices);
  assertEqual(idx['b1'], 'Truck Alpha');
  assertEqual(idx['b2'], 'Van Beta');
});

test('empty input → empty object', () => {
  assertDeepEqual(buildDeviceIndex([]), {});
});

test('skips entries missing id', () => {
  const idx = buildDeviceIndex([{ id: 'z1', name: 'Good' }, { name: 'No ID' }, null]);
  assertEqual(Object.keys(idx).length, 1);
  assertEqual(idx['z1'], 'Good');
});

test('falls back to "Unknown" for missing name', () => {
  const idx = buildDeviceIndex([{ id: 'z2' }]);
  assertEqual(idx['z2'], 'Unknown');
});

// ---------------------------------------------------------------------------
// filterMappable
// ---------------------------------------------------------------------------

console.log('\nfilterMappable — keep only statuses with GPS coordinates');

test('keeps records that have latitude and longitude', () => {
  const statuses = [
    { device: { id: 'a' }, latitude: 43.6, longitude: -79.4 },
    { device: { id: 'b' }, latitude: 0,    longitude: -79.4 },  // 0 lat → falsy!
    { device: { id: 'c' } },                                      // no coords
    { device: { id: 'd' }, latitude: 43.8, longitude: -79.3 }
  ];
  const result = filterMappable(statuses);
  assertEqual(result.length, 2, 'should keep 2 records');
  assertEqual(result[0].device.id, 'a');
  assertEqual(result[1].device.id, 'd');
});

test('empty input → empty array', () => {
  assertEqual(filterMappable([]).length, 0);
});

test('all mappable → returns all', () => {
  const all = sampleStatuses; // all have lat/lng
  assertEqual(filterMappable(all).length, 3);
});

// ---------------------------------------------------------------------------
// buildRowData
// ---------------------------------------------------------------------------

console.log('\nbuildRowData — assemble display data for a table row');

test('uses device name and computes emoji from speed', () => {
  const device = { id: 'b1', name: 'Truck Alpha' };
  const status = { speed: 55 };
  const row = buildRowData(device, status);
  assertEqual(row.id,    'b1');
  assertEqual(row.name,  'Truck Alpha');
  assertEqual(row.speed, 55);
  assertEqual(row.emoji, '🐎');
});

test('defaults to speed 0 when status is undefined', () => {
  const row = buildRowData({ id: 'b2', name: 'Idle Van' }, undefined);
  assertEqual(row.speed, 0);
  assertEqual(row.emoji, '💤');
});

test('defaults to speed 0 when status.speed is missing', () => {
  const row = buildRowData({ id: 'b3', name: 'Van' }, {});
  assertEqual(row.speed, 0);
  assertEqual(row.emoji, '💤');
});

test('defaults name to "Unknown" when device.name is missing', () => {
  const row = buildRowData({ id: 'b4' }, { speed: 30 });
  assertEqual(row.name, 'Unknown');
});

test('emoji matches getAnimalEmoji for the given speed', () => {
  [0, 10, 30, 70, 120].forEach(function(spd) {
    const row = buildRowData({ id: 'x', name: 'X' }, { speed: spd });
    assertEqual(row.emoji, getAnimalEmoji(spd), `speed ${spd}`);
  });
});

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\n${'─'.repeat(45)}`);
const total = _passed + _failed;
if (_failed === 0) {
  console.log(`All ${total} tests passed.\n`);
  process.exit(0);
} else {
  console.log(`${_failed} of ${total} tests FAILED.\n`);
  process.exit(1);
}
