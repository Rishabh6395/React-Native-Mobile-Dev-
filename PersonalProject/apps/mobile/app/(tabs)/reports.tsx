import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { FileText, Sparkles } from 'lucide-react-native';
import { useTheme } from '../../src/theme/ThemeContext';
import { Screen, Header, EmptyState, Button } from '../../src/components/ui';
import { useGenerateReport, useReports } from '../../src/features/reports/useReports';

export default function ReportsScreen() {
  const { theme } = useTheme();
  
  // Hardcoded to start of week for MVP testing
  const periodStart = new Date();
  periodStart.setHours(0, 0, 0, 0);
  periodStart.setDate(periodStart.getDate() - periodStart.getDay()); 
  
  const { data: reports, isLoading } = useReports('WEEKLY', periodStart.toISOString());
  const generate = useGenerateReport();

  const handleGenerate = () => {
    const end = new Date(periodStart);
    end.setDate(end.getDate() + 7);
    
    generate.mutate({
      type: 'WEEKLY',
      periodStart: periodStart.toISOString(),
      periodEnd: end.toISOString()
    });
  };

  return (
    <Screen
      scrollable
      header={<Header title="Reports" largeTitle />}
    >
      <View style={{ paddingHorizontal: 20 }}>
        {isLoading ? (
          <EmptyState
            icon={<FileText size={48} color={theme.colors.textSecondary} />}
            title="Loading reports..."
            description="Just a moment."
          />
        ) : reports && reports.length > 0 ? (
          <View>
            <TouchableOpacity 
              style={[styles.card, { backgroundColor: theme.colors.card }]}
              onPress={() => router.push(`/report-detail?id=${reports[0].id}`)}
              activeOpacity={0.8}
            >
              <Text style={{ color: theme.colors.text, fontSize: 18, fontWeight: 'bold' }}>
                Weekly Report
              </Text>
              <Text style={{ color: theme.colors.textSecondary, marginTop: 4 }}>
                {new Date(reports[0].periodStart).toLocaleDateString()}
              </Text>
              <Text style={{ color: theme.colors.text, marginTop: 12 }}>
                {reports[0].payload?.headline}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <EmptyState
            icon={<FileText size={48} color={theme.accent.violet} />}
            title="Your Weekly Report is Ready"
            description="Get structured insights and actionable suggestions on where your time went this week."
          />
        )}

        {(!reports || reports.length === 0) && (
          <Button 
            title={generate.isPending ? "Generating..." : "Generate Report"} 
            onPress={handleGenerate} 
            disabled={generate.isPending}
            style={{ marginTop: 20 }}
            icon={<Sparkles size={20} color="#fff" />}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 16,
    marginTop: 16,
  }
});
