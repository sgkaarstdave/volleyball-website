// Manually refresh the checked-in WVV snapshot. No authentication required.
import fs from 'node:fs/promises';import {WVV_SOURCE,WVV_TABLE} from '../wvv-parser.mjs';
const sources=[['wvv-source.html',WVV_SOURCE],['wvv-table.html',WVV_TABLE],['wvv-export.csv','https://ergebnisdienst.volleyball.nrw/servlet/league/PlayingScheduleCsvExport?matchSeriesId=116023057'],['wvv-export.ics','https://ergebnisdienst.volleyball.nrw/iCal/matchSeries/matches.ical?matchSeriesId=116023057&calenderType=ics']];
await Promise.all(sources.map(async([path,url])=>{const r=await fetch(url,{signal:AbortSignal.timeout(30000)});if(!r.ok)throw Error('WVV download failed: '+r.status);await fs.writeFile(path,await r.text())}));
await import('./build-wvv-snapshot.mjs');
