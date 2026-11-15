import {test} from 'node:test';
import assert from 'node:assert/strict';
import {simulateReferenceMatch,simulateStress} from '../scripts/simulate-volleyball.mjs';
test('complete 3:1 match runs through real gesture recognition, every sideout, substitutions, reload and undo',()=>{const result=simulateReferenceMatch();assert.deepEqual(result.sets,[[25,23],[22,25],[25,19],[28,26]]);assert.equal(result.rallies,193);assert.ok(result.traceChecks>200);assert.equal(result.reloadChecks,193);assert.ok(result.undoChecks>=28);assert.ok(Object.keys(result.scenarios).length>=16);});
test('varied reproducible full sets exercise service streaks, all rotations, both teams and optional libero',()=>{const result=simulateStress();assert.equal(result.sets,24);assert.ok(result.rallies>1100);assert.ok(result.traceChecks>1000);});
