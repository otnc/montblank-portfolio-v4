import assert from 'node:assert/strict';
import test from 'node:test';

import { isBirthdayInJapan } from '../src/scripts/birthday-fireworks.ts';

// Japan is UTC+9 all year, so the birthday runs from 15:00 UTC on 1 November
// to 15:00 UTC on 2 November.
test('is the birthday at midnight in Japan', () => {
	assert.equal(isBirthdayInJapan(new Date('2026-11-01T15:00:00Z')), true);
});

test('is still the birthday just before midnight in Japan', () => {
	assert.equal(isBirthdayInJapan(new Date('2026-11-02T14:59:59Z')), true);
});

test('is not the birthday a second before it starts in Japan', () => {
	assert.equal(isBirthdayInJapan(new Date('2026-11-01T14:59:59Z')), false);
});

test('is not the birthday once it has ended in Japan', () => {
	assert.equal(isBirthdayInJapan(new Date('2026-11-02T15:00:00Z')), false);
});

test('is not the birthday on other days', () => {
	assert.equal(isBirthdayInJapan(new Date('2026-11-03T03:00:00Z')), false);
	assert.equal(isBirthdayInJapan(new Date('2026-10-02T03:00:00Z')), false);
});
