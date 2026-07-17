import {
  getUnsyncedCultivationLogs,
  getUnsyncedGacpChecklists,
  deleteLocalCultivationLog,
  deleteLocalGacpChecklist,
} from '../../localDb';
import { cultivationLogsService } from './cultivationLogs';
import { gacpChecklistsService } from './gacpChecklists';

/**
 * Replays queued offline writes against Supabase, last-write-wins.
 * Local rows are a transient buffer — deleted once the write lands.
 */
export async function drainQueue(): Promise<void> {
  const logs = await getUnsyncedCultivationLogs();
  for (const log of logs) {
    const result = await cultivationLogsService.create({
      batchid: log.batchid || null,
      roomname: log.roomname,
      watervolume: log.watervolume,
      waterunit: log.waterunit,
      phin: log.phin,
      ecin: log.ecin,
      runoffvolume: log.runoffvolume,
      phout: log.phout,
      ecout: log.ecout,
      nutrientsfeed: JSON.parse(log.nutrientsfeed),
      operatorid: log.operatorid,
      notes: log.notes,
    });
    if (!result.error) await deleteLocalCultivationLog(log.id);
  }

  const checklists = await getUnsyncedGacpChecklists();
  for (const c of checklists) {
    // gacp_compliance_checklists upserts on checkdate (one row/day), so a
    // queued write always wins over whatever's live — no real conflict case.
    const result = await gacpChecklistsService.upsert({
      checkdate: c.checkdate,
      operatorid: c.operatorid,
      tasks: JSON.parse(c.tasks),
      haspestincident: c.haspestincident,
      incidentdetails: c.incidentdetails,
      correctiveaction: c.correctiveaction,
    });
    if (!result.error) await deleteLocalGacpChecklist(c.id);
  }
}
