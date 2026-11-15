import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {newLab, startLabSet, rotateClockwise, reduceLabSet, appendLabEvent, undoLabEvent, prepareGesture, targetOf, validateLab, labTotals, resultAllowed, LAB_STORAGE_KEY} from '../scout-model.mjs';
import {renderLab} from '../scout-view.mjs';
const lineup = ['David', 'Cedric', 'Slawa', 'Rayan', 'Lukas', 'Jan'];
const start = (serving = 'them') => startLabSet(newLab(), lineup, serving, 'set-1');
const state = lab => reduceLabSet(lab.sets.at(-1));
const event = (lab, value) => appendLabEvent(lab, {id: 'event-' + lab.sets.at(-1).events.length, ...value});
const attack = {kind: 'gesture', player: 'Rayan', action: 'attack', outcome: 'point', origin: '4', countSet: true};
test('lab starts empty and requires six chosen players plus explicit first service', () => {
  assert.equal(newLab().sets.length, 0);
  assert.throws(() => startLabSet(newLab(), [], 'them', 'x'), /sechs/);
  assert.throws(() => startLabSet(newLab(), [...lineup.slice(0, 5), 'David'], 'them', 'x'), /sechs/);
  assert.throws(() => startLabSet(newLab(), lineup, null, 'x'), /Aufschlag/);
  assert.deepEqual(state(start()).lineup, lineup);
});
test('clockwise rotation moves 2 to 1 and 1 to 6 and returns exactly after six rotations', () => {
  let rotated = rotateClockwise(lineup);
  assert.equal(rotated[0], lineup[1]); assert.equal(rotated[5], lineup[0]);
  for (let i = 1; i < 6; i++) rotated = rotateClockwise(rotated);
  assert.deepEqual(rotated, lineup); assert.deepEqual(start().sets[0].lineup, lineup);
});
test('winning reception rotates once; own service series and opponent points do not rotate us', () => {
  let lab = event(start(), {kind: 'rally', winner: 'us'});
  assert.deepEqual(state(lab).score, [1, 0]); assert.equal(state(lab).serving, 'us'); assert.equal(state(lab).rotation, 1);
  assert.equal(state(lab).lineup[0], 'Cedric');
  lab = event(lab, {kind: 'rally', winner: 'us'}); assert.equal(state(lab).rotation, 1);
  lab = event(lab, {kind: 'rally', winner: 'them'}); assert.equal(state(lab).rotation, 1); assert.equal(state(lab).serving, 'them');
  lab = event(lab, {kind: 'rally', winner: 'us'}); assert.equal(state(lab).rotation, 2);
});
test('a swipe draft never mutates stats; confirmed kill records one point and one chosen set destination', () => {
  const lab = start(), before = JSON.stringify(lab);
  const draft = prepareGesture(state(lab), {player: 'Rayan', action: 'attack', from: [.235, .59], to: [.235, .19]});
  assert.equal(draft.direction, 'longline'); assert.equal(draft.origin, '4'); assert.equal(JSON.stringify(lab), before);
  const next = event(lab, {...draft, kind: 'gesture', outcome: 'point'}), a = state(next);
  assert.equal(a.stats.Rayan.kills, 1); assert.equal(a.setsTo['4'], 1); assert.deepEqual(a.score, [1, 0]);
  assert.equal(a.rotation, 1); assert.equal(JSON.stringify(lab), before);
});
test('continue tracks the attempt but no point, kill, error or rotation; positive passes do not imply points', () => {
  let lab = event(start(), {...attack, outcome: 'continue'});
  let a = state(lab); assert.equal(a.stats.Rayan.attacks, 1); assert.equal(a.stats.Rayan.kills, 0); assert.equal(a.stats.Rayan.errors, 0); assert.equal(a.rotation, 0); assert.deepEqual(a.score, [0, 0]);
  lab = event(lab, {kind: 'gesture', player: 'Jan', action: 'pass', outcome: 'good'});
  a = state(lab); assert.equal(a.stats.Jan.goodPasses, 1); assert.deepEqual(a.score, [0, 0]);
});
test('serve into net requires confirmation and credits the serving player with error, never an ace', () => {
  const lab = start('us'), draft = prepareGesture(state(lab), {player: 'David', action: 'serve', from: [.765, .962], to: [.5, .48]});
  assert.equal(draft.suggested, 'error'); assert.equal(draft.reason, 'net');
  assert.equal(resultAllowed(draft, 'point'), false); assert.equal(resultAllowed(draft, 'continue'), false);
  assert.deepEqual(state(lab).score, [0, 0]);
  assert.throws(() => event(lab, {...draft, kind: 'gesture', outcome: 'point'}), /Ergebnis/);
  const next = event(lab, {...draft, kind: 'gesture', outcome: 'error'}), a = state(next);
  assert.equal(a.stats.David.serveErrors, 1); assert.equal(a.stats.David.aces, 0); assert.deepEqual(a.score, [0, 1]); assert.equal(a.rotation, 0); assert.equal(a.serving, 'them');
});
test('service checks current player and service ownership, block checks front row', () => {
  const input = {action: 'serve', from: [.765, .962], to: [.3, .2]};
  assert.throws(() => prepareGesture(state(start()), {...input, player: 'David'}), /Aufschlag/);
  assert.throws(() => prepareGesture(state(start('us')), {...input, player: 'Rayan'}), /Aufschlag/);
  assert.throws(() => event(start('us'), {kind: 'gesture', player: 'Rayan', action: 'serve', outcome: 'point'}), /Aufschlag/);
  assert.throws(() => event(start(), {kind: 'gesture', player: 'Jan', action: 'block', outcome: 'point'}), /Vorderfeld/);
});
test('net, out, short, diagonal and own-side gestures have deterministic classifications', () => {
  assert.equal(targetOf([.5, .48]), 'net'); assert.equal(targetOf([.95, .25]), 'out'); assert.equal(targetOf([.5, .03]), 'out'); assert.equal(targetOf([.5, .8]), 'own');
  assert.throws(() => targetOf([NaN, 0]), /Wischziel/);
  assert.throws(() => prepareGesture(state(start()), {player: 'Rayan', action: 'attack', from: [.2, .6], to: [.21, .6]}), /weiter/);
  assert.equal(prepareGesture(state(start()), {player: 'Rayan', action: 'attack', from: [.235, .59], to: [.75, .19]}).direction, 'diagonal');
});
test('back-row destination is separate from front-row 2 and inferred sets can be disabled', () => {
  let lab = event(start('us'), {...attack, origin: '2h'});
  lab = event(lab, {...attack, origin: '2'}); lab = event(lab, {...attack, countSet: false});
  assert.deepEqual(state(lab).setsTo, {'2h': 1, '2': 1}); assert.equal(state(lab).stats.Rayan.kills, 3);
});
test('undo and reload reverse the whole point including rotation, lineup and inferred set', () => {
  const lab = start(), next = event(lab, attack), loaded = validateLab(JSON.parse(JSON.stringify(next)));
  assert.deepEqual(state(loaded), state(next));
  assert.deepEqual(undoLabEvent(loaded), lab);
  assert.equal(labTotals(undoLabEvent(loaded)).stats.Rayan, undefined);
});
test('manual rotation and service corrections never award points and can be undone', () => {
  const lab = start(), rotated = event(lab, {kind: 'rotate'}), fixed = event(rotated, {kind: 'serving', team: 'us'});
  assert.deepEqual(state(fixed).score, [0, 0]); assert.equal(state(fixed).rotation, 1); assert.equal(state(fixed).serving, 'us');
  assert.deepEqual(undoLabEvent(fixed), rotated); assert.deepEqual(undoLabEvent(rotated), lab);
});
test('substitution follows rotated slot, preserves player stats and undo restores exact field', () => {
  let lab = event(start(), attack);
  const previous = structuredClone(lab), index = state(lab).lineup.indexOf('Rayan');
  lab = event(lab, {kind: 'sub', out: 'Rayan', in: 'Devin'});
  assert.equal(state(lab).lineup[index], 'Devin'); assert.equal(state(lab).stats.Rayan.kills, 1);
  assert.deepEqual(undoLabEvent(lab), previous);
  assert.throws(() => event(lab, {kind: 'sub', out: 'Devin', in: 'David'}), /Auswechslung/);
});
test('duplicate event IDs cannot double count, even in reloaded data', () => {
  const first = appendLabEvent(start(), {id: 'same', ...attack}), second = appendLabEvent(first, {id: 'same', ...attack});
  assert.equal(state(second).stats.Rayan.kills, 1); assert.equal(second.sets[0].events.length, 1);
  second.sets[0].events.push({...second.sets[0].events[0]}); assert.equal(state(second).stats.Rayan.kills, 1);
});
test('each new set requires a fresh lineup, starts at rotation 1 and does not erase previous events', () => {
  const lab = event(start(), attack), before = JSON.stringify(lab), next = startLabSet(lab, [...lineup].reverse(), 'us', 'set-2');
  assert.equal(JSON.stringify(lab), before); assert.deepEqual(next.sets[0], lab.sets[0]);
  assert.deepEqual(state(next).score, [0, 0]); assert.equal(state(next).rotation, 0); assert.equal(labTotals(next).stats.Rayan.kills, 1);
  assert.throws(() => startLabSet(lab, [], 'us', 'set-2'), /sechs/);
});
test('set finishes at target with two-point margin; undo permits correction and set five targets 15', () => {
  let lab = start();
  for (let i = 0; i < 24; i++) {lab = event(lab, {kind: 'rally', winner: 'us'}); lab = event(lab, {kind: 'rally', winner: 'them'});}
  lab = event(lab, {kind: 'rally', winner: 'us'}); assert.equal(state(lab).finished, false);
  lab = event(lab, {kind: 'rally', winner: 'us'}); assert.equal(state(lab).finished, true);
  assert.throws(() => event(lab, attack), /Satzende/); assert.equal(state(undoLabEvent(lab)).finished, false);
  for (let i = 2; i <= 5; i++) lab = startLabSet(lab, lineup, 'us', 'set-' + i);
  assert.equal(lab.sets[4].target, 15);
});
test('test UI and storage are isolated from admin and cloud modules and all names are escaped', async () => {
  const lab = start(), html = renderLab(lab);
  assert.ok(html.includes('Nur Testdaten auf diesem Gerät')); assert.ok(html.includes('data-court-player="4"')); assert.ok(html.includes('data-rally="us"'));
  assert.notEqual(LAB_STORAGE_KEY, 'rallyboard-v1');
  const controller = await readFile(new URL('../scout-lab.mjs', import.meta.url), 'utf8');
  const page = await readFile(new URL('../lab.html', import.meta.url), 'utf8');
  for (const text of [controller, page]) for (const forbidden of ['cloud.mjs', 'supabase.co', 'indexedDB', 'rallyboard-auth', 'serviceWorker.register']) assert.ok(!text.includes(forbidden), forbidden);
  lab.roster[0] = '<script>';
  assert.ok(renderLab(lab).includes('&lt;script&gt;')); assert.ok(!renderLab(lab).includes('<script>'));
});
