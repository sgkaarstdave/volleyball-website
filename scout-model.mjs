// The scouting lab has its own data model and never imports the production cloud client.
export const LAB_STORAGE_KEY = 'rallyboard-scout-lab-v1';
export const LAB_ROSTER = ['Rayan', 'Cedric', 'Slawa', 'Jan', 'Lukas', 'David', 'Devin', 'Lionel', 'Dave'];
export const ACTIONS = {attack: 'Angriff', serve: 'Aufschlag', pass: 'Annahme', defense: 'Abwehr', block: 'Block'};
export const ATTACK_SPOTS = {'4': 'Pos. 4', '3': 'Pos. 3', '2': 'Pos. 2', '2h': 'Pos. 2 Hinterfeld', '6': 'Pos. 6'};
export const ATTACK_ORDER = ['4', '3', '2', '2h', '6'];
export const COURT = {left: .1, right: .9, top: .07, net: .48, bottom: .9};
export const SLOT_POINTS = {1: [.765, .81], 2: [.765, .59], 3: [.5, .59], 4: [.235, .59], 5: [.235, .81], 6: [.5, .81]};
const clone = value => structuredClone(value);
const check = (ok, message) => {if (!ok) throw Error(message);};
export const newLab = () => ({version: 1, roster: [...LAB_ROSTER], sets: []});
export function validateLineup(lineup, roster = LAB_ROSTER) {
  check(Array.isArray(lineup) && lineup.length === 6 && new Set(lineup).size === 6 && lineup.every(n => roster.includes(n)), 'Bitte sechs verschiedene Spieler aufstellen.');
}
export function startLabSet(lab, lineup, serving, id) {
  validateLineup(lineup, lab.roster);
  check(['us', 'them'].includes(serving), 'Bitte das Aufschlagrecht auswählen.');
  check(typeof id === 'string' && id && !lab.sets.some(s => s.id === id), 'Ungültiger Satz.');
  const next = clone(lab);
  next.sets.push({id, lineup: [...lineup], serving, target: next.sets.length === 4 ? 15 : 25, events: []});
  return next;
}
export const rotateClockwise = lineup => [...lineup.slice(1), lineup[0]];
function validPoint(p) {return Array.isArray(p) && p.length === 2 && p.every(n => Number.isFinite(n) && Math.abs(n) < 10);}
export function targetOf(to) {
  check(validPoint(to), 'Ungültiges Wischziel.');
  const [x, y] = to;
  if (x < COURT.left || x > COURT.right || y < COURT.top || y > COURT.bottom) return 'out';
  if (Math.abs(y - COURT.net) <= .025) return 'net';
  return y < COURT.net ? 'opponent' : 'own';
}
export function prepareGesture(state, {player, action, from, to}) {
  check(!state.finished, 'Der Satz ist beendet. Bitte einen neuen Satz starten oder rückgängig machen.');
  const slot = state.lineup.indexOf(player) + 1;
  check(slot > 0 && ACTIONS[action], 'Spieler oder Aktion nicht verfügbar.');
  check(validPoint(from) && validPoint(to), 'Ungültige Wischbewegung.');
  check(Math.hypot(to[0] - from[0], to[1] - from[1]) >= .055, 'Zum Wischen etwas weiter ziehen – oder die Aktionsbuttons nutzen.');
  if (action === 'serve') check(state.serving === 'us' && slot === 1, 'Aufschlag hat nur unser aktueller Spieler auf Position 1.');
  if (action === 'block') check([2, 3, 4].includes(slot), 'Für den Block bitte einen Vorderfeldspieler wählen.');
  const target = targetOf(to), positive = ['attack', 'serve', 'block'].includes(action);
  const direction = target === 'opponent' ? (Math.abs(to[0] - from[0]) < .22 ? 'longline' : 'diagonal') : null;
  return {player, action, from: [...from], to: [...to], slot, target, direction,
    origin: action === 'attack' ? ([2, 3, 4].includes(slot) ? String(slot) : slot === 1 ? '2h' : slot === 6 ? '6' : '') : '',
    suggested: positive && target !== 'opponent' ? 'error' : 'continue',
    reason: target === 'net' ? 'net' : target === 'out' ? 'out' : 'other', countSet: action === 'attack'};
}
export function resultAllowed(gesture, outcome) {
  const positive = ['attack', 'serve', 'block'].includes(gesture.action);
  if (positive) return ['point', 'continue', 'error'].includes(outcome) && (outcome === 'error' || !gesture.to || targetOf(gesture.to) === 'opponent');
  return ['good', 'continue', 'error'].includes(outcome) && (outcome !== 'good' || !gesture.to || targetOf(gesture.to) === 'own');
}
export function reduceLabSet(set) {
  validateLineup(set.lineup, set.lineup);
  check(['us', 'them'].includes(set.serving) && [15, 25].includes(set.target) && Array.isArray(set.events), 'Ungültige Satzdaten.');
  const state = {lineup: [...set.lineup], score: [0, 0], serving: set.serving, rotation: 0, stats: {}, setsTo: {}, finished: false, rallies: 0};
  const seen = new Set();
  const point = winner => {
    check(['us', 'them'].includes(winner), 'Ungültiger Punkt.');
    state.score[winner === 'us' ? 0 : 1]++;
    state.rallies++;
    if (winner === 'us' && state.serving === 'them') {state.lineup = rotateClockwise(state.lineup); state.rotation = (state.rotation + 1) % 6;}
    state.serving = winner;
    state.finished = Math.max(...state.score) >= set.target && Math.abs(state.score[0] - state.score[1]) >= 2;
  };
  for (const e of set.events) {
    check(typeof e.id === 'string' && e.id, 'Ereignis-ID fehlt.');
    if (seen.has(e.id)) continue;
    seen.add(e.id);
    check(!state.finished, 'Nach Satzende können keine Aktionen erfasst werden.');
    if (e.kind === 'rally') {point(e.winner); continue;}
    if (e.kind === 'rotate') {state.lineup = rotateClockwise(state.lineup); state.rotation = (state.rotation + 1) % 6; continue;}
    if (e.kind === 'serving') {check(['us', 'them'].includes(e.team), 'Ungültiges Aufschlagrecht.'); state.serving = e.team; continue;}
    if (e.kind === 'sub') {
      const slot = state.lineup.indexOf(e.out);
      check(slot >= 0 && typeof e.in === 'string' && !state.lineup.includes(e.in), 'Auswechslung nicht möglich.');
      state.lineup[slot] = e.in; continue;
    }
    check(e.kind === 'gesture' && ACTIONS[e.action] && state.lineup.includes(e.player), 'Ungültige Spieleraktion.');
    const slot = state.lineup.indexOf(e.player) + 1;
    if (e.action === 'serve') check(state.serving === 'us' && slot === 1, 'Falscher Aufschlagspieler.');
    if (e.action === 'block') check([2, 3, 4].includes(slot), 'Block nur im Vorderfeld.');
    check(resultAllowed(e, e.outcome), 'Das Ergebnis passt nicht zu dieser Aktion oder zum Wischziel.');
    if (e.from || e.to) {
      check(validPoint(e.from) && validPoint(e.to) && Math.hypot(e.to[0] - e.from[0], e.to[1] - e.from[1]) >= .055, 'Ungültige Wischbewegung.');
    }
    check(!e.origin || ATTACK_SPOTS[e.origin], 'Unbekannter Angriffsort.');
    const p = state.stats[e.player] ??= {kills: 0, aces: 0, blocks: 0, errors: 0, attacks: 0, serves: 0, goodPasses: 0, goodDefenses: 0, attackErrors: 0, serveErrors: 0, passErrors: 0, defenseErrors: 0, blockErrors: 0, continued: 0};
    if (e.action === 'attack') p.attacks++;
    if (e.action === 'serve') p.serves++;
    if (e.outcome === 'point') p[{attack: 'kills', serve: 'aces', block: 'blocks'}[e.action]]++;
    if (e.outcome === 'good') p[e.action === 'pass' ? 'goodPasses' : 'goodDefenses']++;
    if (e.outcome === 'continue') p.continued++;
    if (e.outcome === 'error') {p.errors++; p[{attack: 'attackErrors', serve: 'serveErrors', pass: 'passErrors', defense: 'defenseErrors', block: 'blockErrors'}[e.action]]++;}
    if (e.action === 'attack' && e.countSet && e.origin) state.setsTo[e.origin] = (state.setsTo[e.origin] || 0) + 1;
    if (e.outcome === 'point' || e.outcome === 'error') point(e.outcome === 'point' ? 'us' : 'them');
  }
  return state;
}
export function validateLab(lab) {
  check(lab?.version === 1 && Array.isArray(lab.roster) && lab.roster.length >= 6 && lab.roster.every(n => typeof n === 'string' && n.length > 0 && n.length <= 80) && new Set(lab.roster).size === lab.roster.length && Array.isArray(lab.sets), 'Ungültige Testdaten.');
  const ids = new Set();
  for (const set of lab.sets) {
    check(typeof set.id === 'string' && !ids.has(set.id), 'Ungültige Satz-ID.'); ids.add(set.id);
    validateLineup(set.lineup, lab.roster);
    for (const e of set.events) if (e.kind === 'sub') check(lab.roster.includes(e.in), 'Einwechselspieler nicht im Kader.');
    reduceLabSet(set);
  }
  return lab;
}
export function appendLabEvent(lab, event) {
  check(lab.sets.length, 'Bitte zuerst eine Aufstellung festlegen.');
  const next = clone(lab), set = next.sets.at(-1);
  if (set.events.some(e => e.id === event.id)) return next;
  set.events.push(clone(event));
  validateLab(next);
  return next;
}
export function undoLabEvent(lab) {
  const next = clone(lab);
  next.sets.at(-1)?.events.pop();
  return validateLab(next);
}
export function labTotals(lab) {
  const stats = {}, setsTo = {};
  for (const set of lab.sets) {
    const a = reduceLabSet(set);
    for (const [name, row] of Object.entries(a.stats)) for (const [key, value] of Object.entries(row)) {(stats[name] ??= {})[key] = (stats[name]?.[key] || 0) + value;}
    for (const [key, value] of Object.entries(a.setsTo)) setsTo[key] = (setsTo[key] || 0) + value;
  }
  return {stats, setsTo};
}
