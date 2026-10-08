import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from '../src/theme/ThemeContext';
import { Screen, Header } from '../src/components/ui';
import { ReportCard } from '../src/components/cards/ReportCard';
import { useReports } from '../src/features/reports/useReports';
import { ReportSection } from 'shared';

export default function ReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();

  // For this MVP step, we mock fetching the exact report.
  // In production, we'd fetch by ID or filter from the list.
  const periodStart = new Date();
  periodStart.setHours(0, 0, 0, 0);
  periodStart.setDate(periodStart.getDate() - periodStart.getDay()); 
  const { data: reports } = useReports('WEEKLY', periodStart.toISOString());
  
  const report = reports?.find(r => r.id === id) || reports?.[0];

  if (!report) {
    return (
      <Screen header={<Header title="Report Detail" showBack />}>
        <Text style={{ color: theme.colors.text }}>Report not found.</Text>
      </Screen>
    );
  }

  const { payload } = report;

  return (
    <Screen header={<Header title={`${report.type} Report`} showBack />} scrollable>
      <View style={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        
        {/* Headline */}
        <Text style={[styles.headline, { color: theme.colors.text }]}>
          {payload.headline}
        </Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: theme.colors.card }]}>
            <Text style={styles.statValue}>
              {Math.floor(payload.totalMinutes / 60)}h {payload.totalMinutes % 60}m
            </Text>
            <Text style={styles.statLabel}>Total Time</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.statValue, { color: payload.deltaPct > 0 ? '#FF453A' : '#30D158' }]}>
              {payload.deltaPct > 0 ? '+' : ''}{payload.deltaPct}%
            </Text>
            <Text style={styles.statLabel}>vs Last Week</Text>
          </View>
        </View>

        {/* Sections */}
        {payload.sections.map((section: ReportSection, index: number) => (
          <ReportCard key={index} section={section} />
        ))}
        
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headline: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 24,
    marginTop: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  }
});
