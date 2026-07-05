import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { colors, spacing, radius, fontSize, fontWeight, commonStyles } from '../src/constants/theme';
import { useTranslation, TranslationKey } from '../src/constants/i18n';
import { GlassCard, StepperInput, SubTabBar } from '../src/components/ui';

interface VpdCalculatorScreenProps {
  isTh: boolean;
}

// Saturation Vapor Pressure formula (Tetens equation in kPa)
const getSVP = (tempCelsius: number) => {
  return 0.61078 * Math.exp((17.27 * tempCelsius) / (tempCelsius + 237.3));
};

export default function VpdCalculatorScreen({ isTh }: VpdCalculatorScreenProps) {
  const { t } = useTranslation(isTh);
  const [roomTemp, setRoomTemp] = useState<number>(25.0); // in Celsius
  const [rh, setRh] = useState<number>(60.0); // in percentage
  const [offset, setOffset] = useState<number>(-2.0); // in Celsius
  const [useFahrenheit, setUseFahrenheit] = useState<boolean>(false);

  // Memoize all calculations to avoid recalculating on unrelated renders
  const calculations = useMemo(() => {
    const leafTempC = roomTemp + offset;
    const svpAir = getSVP(roomTemp);
    const svpLeaf = getSVP(leafTempC);
    const avpAir = svpAir * (rh / 100);
    const vpd = Math.max(0, svpLeaf - avpAir);

    // Temperature unit conversions for display
    const displayRoomTemp = useFahrenheit ? (roomTemp * 9) / 5 + 32 : roomTemp;
    const displayLeafTemp = useFahrenheit ? (leafTempC * 9) / 5 + 32 : leafTempC;
    const displayOffset = useFahrenheit ? (offset * 9) / 5 : offset;
    const tempUnit = useFahrenheit ? '°F' : '°C';

    // VPD Status & Actions
    let statusTextKey: TranslationKey = 'vpd_status_too_wet';
    let statusDescKey: TranslationKey = 'vpd_status_too_wet_desc';
    let statusColor: string = colors.info; // blue

    if (vpd < 0.4) {
      statusTextKey = 'vpd_status_too_wet';
      statusDescKey = 'vpd_status_too_wet_desc';
      statusColor = colors.info;
    } else if (vpd >= 0.4 && vpd < 0.8) {
      statusTextKey = 'vpd_status_clone';
      statusDescKey = 'vpd_status_clone_desc';
      statusColor = colors.accent; // green
    } else if (vpd >= 0.8 && vpd <= 1.1) {
      statusTextKey = 'vpd_status_veg';
      statusDescKey = 'vpd_status_veg_desc';
      statusColor = colors.accent;
    } else if (vpd > 1.1 && vpd <= 1.5) {
      statusTextKey = 'vpd_status_bloom';
      statusDescKey = 'vpd_status_bloom_desc';
      statusColor = colors.warning; // orange
    } else {
      statusTextKey = 'vpd_status_too_dry';
      statusDescKey = 'vpd_status_too_dry_desc';
      statusColor = colors.danger; // red
    }

    return {
      vpd,
      leafTempC,
      svpAir,
      svpLeaf,
      avpAir,
      displayRoomTemp,
      displayLeafTemp,
      displayOffset,
      tempUnit,
      statusTextKey,
      statusDescKey,
      statusColor,
    };
  }, [roomTemp, rh, offset, useFahrenheit]);

  const unitTabs = [
    { key: 'celsius', label: 'Celsius (°C)' },
    { key: 'fahrenheit', label: 'Fahrenheit (°F)' },
  ];

  const handleTabChange = (key: string) => {
    setUseFahrenheit(key === 'fahrenheit');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Unit Selector using SubTabBar */}
      <SubTabBar
        tabs={unitTabs}
        activeTab={useFahrenheit ? 'fahrenheit' : 'celsius'}
        onTabChange={handleTabChange}
      />

      {/* Main VPD Gauge Display */}
      <View style={[styles.resultCard, { borderColor: calculations.statusColor }]}>
        <Text style={styles.resultLabel}>{t('vpd_leaf_vpd')}</Text>
        <Text style={[styles.resultValue, { color: calculations.statusColor }]}>
          {calculations.vpd.toFixed(2)} <Text style={styles.resultUnit}>kPa</Text>
        </Text>

        <View style={styles.statusBadge}>
          <Text style={[styles.statusBadgeText, { color: calculations.statusColor }]}>
            {t(calculations.statusTextKey)}
          </Text>
        </View>

        <Text style={styles.actionText}>{t(calculations.statusDescKey)}</Text>
      </View>

      {/* Inputs Section using GlassCard and StepperInput */}
      <GlassCard title={t('vpd_set_env')}>
        {/* Room Temp Input */}
        <StepperInput
          label={t('vpd_room_temp')}
          value={roomTemp}
          displayValue={`${calculations.displayRoomTemp.toFixed(1)} ${calculations.tempUnit}`}
          step={useFahrenheit ? 0.9 : 0.5} // equivalent steps
          min={10}
          max={45}
          onValueChange={(val) => {
            // bound clamp and handle conversion if necessary
            setRoomTemp(val);
          }}
        />

        {/* Humidity Input */}
        <StepperInput
          label={t('vpd_humidity_rh')}
          value={rh}
          displayValue={`${rh.toFixed(1)} %`}
          step={1}
          min={10}
          max={95}
          onValueChange={setRh}
        />

        {/* Leaf Temp Offset */}
        <StepperInput
          label={t('vpd_offset')}
          value={offset}
          displayValue={`${calculations.displayOffset.toFixed(1)} ${calculations.tempUnit}`}
          step={useFahrenheit ? 0.9 : 0.5}
          min={-10}
          max={5}
          onValueChange={setOffset}
        />
      </GlassCard>

      {/* Summary Telemetry breakdown using GlassCard */}
      <GlassCard title={t('vpd_breakdown')}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{t('vpd_leaf_temp')}</Text>
          <Text style={styles.summaryValue}>
            {calculations.displayLeafTemp.toFixed(1)} {calculations.tempUnit}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{t('vpd_svp_leaf')}</Text>
          <Text style={styles.summaryValue}>{calculations.svpLeaf.toFixed(2)} kPa</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>{t('vpd_avp_air')}</Text>
          <Text style={styles.summaryValue}>{calculations.avpAir.toFixed(2)} kPa</Text>
        </View>
      </GlassCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
  },
  resultCard: {
    backgroundColor: colors.cardSolid,
    borderRadius: radius.xxl,
    borderWidth: 2,
    padding: spacing.xxl,
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  resultLabel: {
    color: colors.textMuted,
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  resultValue: {
    fontFamily: 'monospace',
    fontSize: fontSize.display,
    fontWeight: fontWeight.black,
    marginVertical: 10,
  },
  resultUnit: {
    fontSize: 20,
    fontWeight: fontWeight.normal,
    color: colors.textMuted,
  },
  statusBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: radius.full,
    marginBottom: spacing.lg,
  },
  statusBadgeText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.extrabold,
  },
  actionText: {
    color: colors.text,
    fontSize: fontSize.md,
    textAlign: 'center',
    lineHeight: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: fontSize.md,
  },
  summaryValue: {
    color: colors.text,
    fontFamily: 'monospace',
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
});
