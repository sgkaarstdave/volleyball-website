import {LAB_STORAGE_KEY, ACTIONS, ATTACK_SPOTS, ATTACK_ORDER, SLOT_POINTS, newLab, validateLab, startLabSet, reduceLabSet, prepareGesture, resultAllowed, appendLabEvent, undoLabEvent} from './scout-model.mjs?v=lab1';
import {renderLab, esc, resultLabel, reasonLabel} from './scout-view.mjs?v=lab1';

const $ = selector => document.querySelector(selector);
const BACKUP_KEY = 'rallyboard-scout-lab-last-reset-v1';
let lab = newLab(), action = 'attack', saveError = '', baseline = null, brokenStorage = false, pointer = null;
try {
  baseline = localStorage.getItem(LAB_STORAGE_KEY);
  if (baseline) lab = validateLab(JSON.parse(baseline));
} catch {
  brokenStorage = true;
  saveError = 'Gespeicherte Testdaten konnten nicht geladen werden. Exportiere sie zur Sicherung oder beginne einen neuen Test. Echte Spieldaten sind davon nicht betroffen.';
}
const uid = () => crypto.randomUUID();
const currentSet = () => lab.sets.at(-1);
const currentState = () => currentSet() && reduceLabSet(currentSet());
function notice(text) {
  $('#lab-notice').textContent = text;
  $('#lab-notice').style.display = 'block';
  clearTimeout(notice.timer);
  notice.timer = setTimeout(() => {$('#lab-notice').style.display = 'none';}, 4400);
}
function persist(next, {force = false} = {}) {
  try {
    if (brokenStorage && !force) throw Error('Bitte die nicht lesbaren Testdaten zuerst exportieren und den Test neu beginnen.');
    if (localStorage.getItem(LAB_STORAGE_KEY) !== baseline) throw Error('Der Test wurde in einem anderen Tab geändert. Bitte neu laden.');
    validateLab(next);
    const text = JSON.stringify(next);
    localStorage.setItem(LAB_STORAGE_KEY, text);
    baseline = text; lab = next; saveError = ''; brokenStorage = false;
    render();
    return true;
  } catch (e) {
    saveError = 'Nicht gespeichert: ' + e.message;
    notice(saveError);
    const alert = document.createElement('p'); alert.className = 'save-error'; alert.setAttribute('role', 'alert'); alert.textContent = saveError;
    $('#lab-dialog').open ? $('#lab-dialog').append(alert) : render();
    return false;
  }
}
function commit(event) {
  try {return persist(appendLabEvent(lab, {id: uid(), at: new Date().toISOString(), ...event}));}
  catch (e) {notice(e.message); return false;}
}
function dialog(html) {
  const element = $('#lab-dialog');
  if (element.open) element.close();
  element.innerHTML = html;
  element.showModal();
  $('#lab-close')?.addEventListener('click', () => element.close());
}
const close = '<button type="button" class="dialog-close" id="lab-close" aria-label="Schließen">✕</button>';
const heading = (kicker, title) => `<div class="dialog-head"><div><span class="kicker">${kicker}</span><h2>${title}</h2></div>${close}</div>`;
function startPanel() {
  const existing = currentSet(), previous = currentState(), assignments = {};
  let zone = 4, serving = null;
  dialog(heading(`TESTSATZ ${lab.sets.length + 1}`, 'Deine sechs Spieler.') + `<p class="dialog-description">Besetze die Positionen und wähle, wer zuerst aufschlägt.${existing && !previous.finished ? ' Der laufende Testsatz bleibt mit seinen Aktionen gespeichert.' : ''}</p><div id="lab-lineup"></div><div class="lineup-actions"><button id="lab-example">Testaufstellung füllen</button>${existing ? '<button id="lab-copy">Letzte Aufstellung übernehmen</button>' : ''}</div><label>Wer hat den ersten Aufschlag?</label><div class="serve-choice"><button type="button" data-serving="us">SG Kaarst</button><button type="button" data-serving="them">Gegner</button></div><button id="lab-start" class="lab-primary wide" disabled>Aufstellung bestätigen & testen</button><p class="fine-print">Der Spieler auf Position 1 schlägt bei eigenem Aufschlag auf. ${lab.sets.length === 4 ? 'Testsatz 5 wird bis 15' : 'Dieser Testsatz wird bis 25'} Punkte mit zwei Punkten Abstand gespielt.</p>`);
  function paint() {
    $('#lab-lineup').innerHTML = `<div class="lineup-grid">${[4, 3, 2, 5, 6, 1].map(p => `<button data-zone="${p}" class="${zone === p ? 'chosen' : ''}"><small>Position ${p}</small><b>${esc(assignments[p] || 'Spieler wählen')}</b></button>`).join('')}</div><p class="fine-print">${Object.values(assignments).filter(Boolean).length} von 6 gewählt · Feld antippen, dann einen Spieler.</p><div class="lineup-people">${lab.roster.map((n, i) => `<button data-person="${i}" class="${Object.values(assignments).includes(n) ? 'used' : ''}">${esc(n)}</button>`).join('')}</div>`;
    $('#lab-start').disabled = Object.values(assignments).filter(Boolean).length !== 6 || !serving;
    document.querySelectorAll('[data-zone]').forEach(b => b.onclick = () => {zone = +b.dataset.zone; paint();});
    document.querySelectorAll('[data-person]').forEach(b => b.onclick = () => {
      const name = lab.roster[+b.dataset.person], other = Object.keys(assignments).find(p => assignments[p] === name), replaced = assignments[zone];
      if (Number(other) === zone) delete assignments[zone];
      else {if (other) {delete assignments[other]; if (replaced) assignments[other] = replaced;} assignments[zone] = name;}
      zone = [4, 3, 2, 5, 6, 1].find(p => !assignments[p]) || zone;
      paint();
    });
  }
  $('#lab-example').onclick = () => {lab.roster.slice(0, 6).forEach((n, i) => {assignments[i + 1] = n;}); paint();};
  if ($('#lab-copy')) $('#lab-copy').onclick = () => {previous.lineup.forEach((n, i) => {assignments[i + 1] = n;}); paint();};
  document.querySelectorAll('[data-serving]').forEach(b => b.onclick = () => {serving = b.dataset.serving; document.querySelectorAll('[data-serving]').forEach(v => v.classList.toggle('selected', v === b)); paint();});
  $('#lab-start').onclick = () => {
    try {if (persist(startLabSet(lab, [1, 2, 3, 4, 5, 6].map(p => assignments[p]), serving, uid()))) {$('#lab-dialog').close(); notice('Test gestartet · Aufstellung und Aufschlagrecht sind gesetzt.');}}
    catch (e) {notice(e.message);}
  };
  paint();
}
function resultPanel(draft) {
  const sourceSet = currentSet(), sourceCount = sourceSet.events.length;
  const positive = ['attack', 'serve', 'block'].includes(draft.action), pointResult = positive ? 'point' : 'good';
  const hint = !draft.to ? 'Button-Modus: Wähle das beobachtete Ergebnis.' : draft.target === 'net' ? 'Das Wischziel liegt am Netz. Fehler wird vorgeschlagen – erst deine Bestätigung zählt.' : draft.target === 'out' ? 'Das Wischziel liegt im Aus. Fehler wird vorgeschlagen – erst deine Bestätigung zählt.' : draft.suggested === 'error' ? 'Das Ziel liegt auf der eigenen Seite. Für einen erfolgreichen Angriff bitte neu ziehen.' : 'Der Wischweg zeigt nur ein Ballziel. Bestätige, was tatsächlich passiert ist.';
  dialog(heading('AKTION BESTÄTIGEN', `${esc(draft.player)} · ${ACTIONS[draft.action]}`) + `<div class="result-preview"><b>${draft.to ? 'Spieler → ' + ({net: 'Netz', out: 'Aus', own: 'eigenes Feld', opponent: 'gegnerisches Feld'}[draft.target]) : 'Spieler angetippt'}</b><span>${draft.direction ? 'Richtung: ' + (draft.direction === 'longline' ? 'eher Longline' : 'eher diagonal') : 'Rotation R' + (currentState().rotation + 1)}</span></div><p class="result-hint">${hint}</p>${draft.action === 'attack' ? `<label for="attack-spot">Tatsächlicher Angriffsort</label><select id="attack-spot"><option value="">Nicht zuordnen</option>${ATTACK_ORDER.map(id => {const label = ATTACK_SPOTS[id]; return `<option value="${id}" ${draft.origin === id ? 'selected' : ''}>${label}</option>`;}).join('')}</select><label class="check-row"><input type="checkbox" id="count-set" checked><span>Zuspiel zu diesem Angriff mitzählen</span></label><p class="fine-print">Der Rotationsplatz ist nicht immer der Angriffsort. Bei direktem Rückspiel das Häkchen entfernen.</p>` : ''}<label for="error-reason">Falls Fehler: Was ist passiert?</label><select id="error-reason">${Object.entries({other: 'Sonstiger Fehler', net: 'Ins Netz', out: 'Ins Aus', blocked: 'Geblockt'}).map(([id, label]) => `<option value="${id}" ${draft.reason === id ? 'selected' : ''}>${label}</option>`).join('')}</select><div class="result-buttons"><button class="result-good" data-outcome="${pointResult}" ${resultAllowed(draft, pointResult) ? '' : 'disabled'}><span>✓</span>${positive ? 'Punkt' : 'Gut'}</button><button class="result-continue" data-outcome="continue" ${resultAllowed(draft, 'continue') ? '' : 'disabled'}><span>↔</span>Weiter</button><button class="result-error" data-outcome="error"><span>✕</span>Fehler</button></div><p class="fine-print">${positive ? 'Punkt: Spielerpunkt und Spielstand +1. Fehler: Spielerfehler und Gegnerpunkt +1.' : 'Gut: positiver Ballkontakt, kein Punkt. Fehler: Spielerfehler und Gegnerpunkt +1.'} Weiter: nur die Aktion, kein Punkt und kein Fehler. Schließen verwirft die Eingabe.</p>`);
  document.querySelectorAll('[data-outcome]').forEach(b => b.onclick = () => {
    if (currentSet().id !== sourceSet.id || currentSet().events.length !== sourceCount) {$('#lab-dialog').close(); notice('Der Satz hat sich geändert. Bitte die Aktion neu erfassen.'); return;}
    const outcome = b.dataset.outcome, origin = $('#attack-spot')?.value || '', countSet = !!$('#count-set')?.checked, reason = $('#error-reason').value;
    const before = currentState();
    if (commit({...draft, kind: 'gesture', outcome, origin, countSet, reason})) {
      $('#lab-dialog').close();
      const after = currentState(), rotated = after.rotation !== before.rotation;
      notice(`${draft.player} · ${resultLabel(draft.action, outcome)}${outcome === 'error' ? ' · ' + reasonLabel(reason) : ''}${rotated ? ' · Team rotiert' : ''}`);
    }
  });
}
function buttonAction(slot) {
  const state = currentState(), player = state.lineup[slot - 1];
  resultPanel({player, action, slot, origin: action === 'attack' ? ([2, 3, 4].includes(slot) ? String(slot) : slot === 1 ? '2h' : slot === 6 ? '6' : '') : '', reason: 'other', suggested: 'continue'});
}
function bindCourt() {
  const court = $('#gesture-court');
  if (!court) return;
  const pointAt = e => {const r = court.getBoundingClientRect(); return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height];};
  const clear = () => {pointer = null; const line = $('#swipe-trail'); if (line) line.setAttribute('d', '');};
  court.onpointerdown = e => {
    const chip = e.target.closest('[data-court-player]');
    if (!chip || chip.disabled || !e.isPrimary || e.button !== 0 || pointer) return;
    const slot = +chip.dataset.courtPlayer, from = action === 'serve' ? [.765, .962] : SLOT_POINTS[slot];
    pointer = {id: e.pointerId, slot, from, start: pointAt(e), moved: false};
    court.setPointerCapture(e.pointerId); e.preventDefault();
  };
  court.onpointermove = e => {
    if (!pointer || e.pointerId !== pointer.id) return;
    const to = pointAt(e);
    pointer.moved ||= Math.hypot(to[0] - pointer.start[0], to[1] - pointer.start[1]) > .025;
    if (pointer.moved) $('#swipe-trail').setAttribute('d', `M ${pointer.from[0] * 600} ${pointer.from[1] * 700} L ${to[0] * 600} ${to[1] * 700}`);
  };
  court.onpointerup = e => {
    if (!pointer || e.pointerId !== pointer.id) return;
    const end = {...pointer, to: pointAt(e)};
    clear();
    if (court.hasPointerCapture(e.pointerId)) court.releasePointerCapture(e.pointerId);
    if (!end.moved && Math.hypot(end.to[0] - end.start[0], end.to[1] - end.start[1]) < .055) {buttonAction(end.slot); return;}
    try {resultPanel(prepareGesture(currentState(), {player: currentState().lineup[end.slot - 1], action, from: end.from, to: end.to}));}
    catch (error) {notice(error.message);}
  };
  court.onpointercancel = clear;
  court.onlostpointercapture = clear;
  court.querySelectorAll('[data-court-player]').forEach(b => b.onclick = e => {if (e.detail === 0) buttonAction(+b.dataset.courtPlayer);});
}
function correctionPanel() {
  dialog(heading('NUR WENN NÖTIG', 'Rotation korrigieren') + '<p class="dialog-description">Ein Schritt rotiert im Uhrzeigersinn: 2 → 1 → 6 → 5 → 4 → 3 → 2. Der Spielstand ändert sich dabei nicht.</p><button id="rotate-once" class="lab-primary wide">Eine Position weiterrotieren ↻</button><label>Aufschlagrecht korrigieren (ohne Rotation)</label><div class="serve-choice"><button data-fix-serving="us">SG Kaarst hat Aufschlag</button><button data-fix-serving="them">Gegner hat Aufschlag</button></div><p class="fine-print">Jede Korrektur kann über Rückgängig aufgehoben werden.</p>');
  $('#rotate-once').onclick = () => {if (commit({kind: 'rotate'})) {$('#lab-dialog').close(); notice('Rotation korrigiert · Spielstand unverändert.');}};
  document.querySelectorAll('[data-fix-serving]').forEach(b => b.onclick = () => {if (commit({kind: 'serving', team: b.dataset.fixServing})) {$('#lab-dialog').close(); notice('Aufschlagrecht korrigiert.');}});
}
function subPanel() {
  const state = currentState(), bench = lab.roster.filter(n => !state.lineup.includes(n));
  dialog(heading('SPIELERWECHSEL', 'Wer kommt rein?') + `<form id="lab-swap"><label for="lab-out">Spieler auf dem Feld</label><select id="lab-out">${state.lineup.map((n, i) => `<option value="${esc(n)}">${esc(n)} · Pos. ${i + 1}</option>`).join('')}</select><label for="lab-in">Spieler auf der Bank</label><select id="lab-in">${bench.map(n => `<option>${esc(n)}</option>`).join('')}</select><button class="lab-primary wide" ${bench.length ? '' : 'disabled'}>Wechsel bestätigen</button></form><p class="fine-print">Der Einwechselspieler übernimmt den aktuellen Rotationsplatz. Statistiken bleiben beim jeweiligen Spieler. Wechselbegrenzungen und Libero-Sonderregeln prüft dieser Test noch nicht.</p>`);
  $('#lab-swap').onsubmit = e => {e.preventDefault(); if (commit({kind: 'sub', out: $('#lab-out').value, in: $('#lab-in').value})) {$('#lab-dialog').close(); notice('Wechsel gespeichert.');}};
}
function exportLab() {
  const data = brokenStorage ? baseline || '' : JSON.stringify(lab, null, 2), url = URL.createObjectURL(new Blob([data], {type: 'application/json'}));
  const link = document.createElement('a'); link.href = url; link.download = 'rallyboard-testlabor.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function resetPanel() {
  dialog(heading('NEUER DURCHLAUF', 'Test neu beginnen?') + '<p class="dialog-description">Deine bisherigen Testdaten werden lokal gesichert. Du kannst die letzte Sicherung wiederherstellen. Echte Spiele und Statistiken bleiben unverändert.</p><button class="lab-primary wide" id="lab-reset-confirm">Test sichern & neu beginnen</button>');
  $('#lab-reset-confirm').onclick = () => {
    try {if (baseline) localStorage.setItem(BACKUP_KEY, baseline); if (persist(newLab(), {force: true})) {$('#lab-dialog').close(); notice('Neuer Test · vorheriger Stand gesichert.');}}
    catch (e) {notice('Nicht zurückgesetzt: ' + e.message);}
  };
}
function restorePanel() {
  dialog(heading('TESTDATEN', 'Letzten Test zurückholen?') + '<p class="dialog-description">Der aktuelle Test wird vorher gesichert. Die Wiederherstellung betrifft nur das Testlabor.</p><button class="lab-primary wide" id="lab-restore-confirm">Letzte Sicherung wiederherstellen</button>');
  $('#lab-restore-confirm').onclick = () => {
    try {const saved = localStorage.getItem(BACKUP_KEY), next = validateLab(JSON.parse(saved)); if (persist(next, {force: true})) {if (baseline) localStorage.setItem(BACKUP_KEY, JSON.stringify(labBeforeRestore)); $('#lab-dialog').close(); notice('Letzter Test wiederhergestellt.');}}
    catch (e) {notice('Nicht wiederhergestellt: ' + e.message);}
  };
  const labBeforeRestore = structuredClone(lab);
}
function render() {
  if (action === 'serve' && currentState()?.serving !== 'us') action = 'attack';
  $('#lab-app').innerHTML = renderLab(lab, {action, saveError});
  $('#lab-app').classList.toggle('has-game', !!currentSet());
  if (!currentSet() && (baseline || brokenStorage)) $('#lab-app').insertAdjacentHTML('beforeend', '<div class="lab-footer"><button id="lab-export">Testdaten exportieren</button><button id="lab-reset">Test neu beginnen</button></div>');
  try {if (localStorage.getItem(BACKUP_KEY)) $('#lab-app').insertAdjacentHTML('beforeend', '<button id="lab-restore" class="wide">Letzten gesicherten Test wiederherstellen</button>');} catch {}
  $('#new-lab-set')?.addEventListener('click', startPanel);
  $('#finished-next')?.addEventListener('click', startPanel);
  $('#lab-undo')?.addEventListener('click', () => {if (persist(undoLabEvent(lab))) notice('Letzte Aktion samt Punkt, Rotation und Zuspiel rückgängig.');});
  $('#lab-sub')?.addEventListener('click', subPanel);
  $('#lab-correct')?.addEventListener('click', correctionPanel);
  $('#lab-export')?.addEventListener('click', exportLab);
  $('#lab-reset')?.addEventListener('click', resetPanel);
  $('#lab-restore')?.addEventListener('click', restorePanel);
  document.querySelectorAll('[data-action-mode]').forEach(b => b.onclick = () => {action = b.dataset.actionMode; render();});
  document.querySelectorAll('[data-rally]').forEach(b => b.onclick = () => {const before = currentState(); if (commit({kind: 'rally', winner: b.dataset.rally})) notice(`Punkt ${b.dataset.rally === 'us' ? 'SG Kaarst' : 'Gegner'}${currentState().rotation !== before.rotation ? ' · Team rotiert' : ''}`);});
  bindCourt();
}
window.addEventListener('storage', e => {
  if (e.key !== LAB_STORAGE_KEY) return;
  try {const next = e.newValue ? validateLab(JSON.parse(e.newValue)) : newLab(); baseline = e.newValue; lab = next; pointer = null; $('#lab-dialog').close(); saveError = ''; render(); notice('Teststand aus anderem Tab übernommen.');}
  catch {saveError = 'Testdaten wurden in einem anderen Tab geändert und sind nicht lesbar. Bitte neu laden.'; render();}
});
window.addEventListener('blur', () => {pointer = null; $('#swipe-trail')?.setAttribute('d', '');});
render();
