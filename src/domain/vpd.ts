// Saturation Vapor Pressure formula (Tetens equation in kPa)
export function getSVP(tempCelsius: number): number {
  return 0.61078 * Math.exp((17.27 * tempCelsius) / (tempCelsius + 237.3));
}

export type VpdStatus = 'too_wet' | 'clone' | 'veg' | 'bloom' | 'too_dry';

export interface VpdResult {
  vpd: number;
  leafTempC: number;
  svpAir: number;
  svpLeaf: number;
  avpAir: number;
  status: VpdStatus;
}

export function calculateVpd(roomTemp: number, rh: number, offset: number): VpdResult {
  const leafTempC = roomTemp + offset;
  const svpAir = getSVP(roomTemp);
  const svpLeaf = getSVP(leafTempC);
  const avpAir = svpAir * (rh / 100);
  const vpd = Math.max(0, svpLeaf - avpAir);

  let status: VpdStatus;
  if (vpd < 0.4) status = 'too_wet';
  else if (vpd < 0.8) status = 'clone';
  else if (vpd <= 1.1) status = 'veg';
  else if (vpd <= 1.5) status = 'bloom';
  else status = 'too_dry';

  return { vpd, leafTempC, svpAir, svpLeaf, avpAir, status };
}
