import { prisma } from "@/lib/prisma";
import { runScanJob } from "@/lib/scanner";

const CHECK_INTERVAL_MS = 60_000;
let started = false;

export function startScheduler() {
  if (started) return;
  started = true;
  console.log("[scheduler] Demarrage du planificateur de jobs");
  checkSchedules();
  setInterval(checkSchedules, CHECK_INTERVAL_MS);
}

async function checkSchedules() {
  try {
    const configs = await prisma.scheduleConfig.findMany({ where: { enabled: true } });
    const now = new Date();

    for (const config of configs) {
      if (config.nextRunAt && config.nextRunAt > now) continue;

      if (config.jobKey === "scan_library") {
        console.log("[scheduler] Declenchement planifie: scan_library");
        try {
          await runScanJob("scheduled");
        } catch (error) {
          console.error("[scheduler] Erreur pendant le job planifie", error);
        }
      }

      const nextRunAt = new Date(now.getTime() + config.intervalMinutes * 60_000);
      await prisma.scheduleConfig.update({
        where: { id: config.id },
        data: { lastRunAt: now, nextRunAt },
      });
    }
  } catch (error) {
    console.error("[scheduler] Erreur lors de la verification des plannings", error);
  }
}
