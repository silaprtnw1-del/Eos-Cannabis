const GAL_TO_L = 3.78541;

export const FACTORS: Record<string, number> = { core: 19, grow: 32, bloom: 32, calmag: 57 };

export interface DosingResult {
  gallons: number;
  doses: Record<string, { ml: number; mlPerGal: number }>;
  currentEcIn: number;
  calMagWarning: boolean;
  runoffAlert: boolean;
}

export function calculateDosing(
  waterVolume: number,
  targetPpm: number,
  activeFerts: Record<string, boolean>,
  phOut: string,
  ecOut: string
): DosingResult {
  const gallons = waterVolume / GAL_TO_L;
  const doses: Record<string, { ml: number; mlPerGal: number }> = {};
  let calMagWarning = false;

  Object.entries(FACTORS).forEach(([fert, factor]) => {
    if (activeFerts[fert]) {
      const mlPerGal = (factor * targetPpm) / 1500;
      const totalMl = mlPerGal * gallons;
      doses[fert] = {
        ml: parseFloat(totalMl.toFixed(2)) || 0,
        mlPerGal: parseFloat(mlPerGal.toFixed(2)) || 0,
      };

      if (fert === 'calmag' && mlPerGal > 5.0) {
        calMagWarning = true;
      }
    } else {
      doses[fert] = { ml: 0, mlPerGal: 0 };
    }
  });

  const currentEcIn = targetPpm / 500; // Hanna scale conversion

  // Runoff alerts validation
  const parsedPhOutVal = parseFloat(phOut);
  const parsedEcOutVal = parseFloat(ecOut);
  let runoffAlert = false;

  if (!isNaN(parsedPhOutVal) && (parsedPhOutVal < 5.5 || parsedPhOutVal > 6.5)) {
    runoffAlert = true;
  }
  if (!isNaN(parsedEcOutVal) && parsedEcOutVal - currentEcIn > 1.0) {
    runoffAlert = true;
  }

  return { gallons, doses, currentEcIn, calMagWarning, runoffAlert };
}
