import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ReportSection } from 'shared';
import { Card } from '../ui/Card'; // Assuming a generic Card exists

interface Props {
  section: ReportSection;
}

export function ReportCard({ section }: Props) {
  switch (section.kind) {
    case 'breakdown':
      return (
        <Card style={styles.card}>
          <Text style={styles.title}>Usage Breakdown</Text>
          {section.items.map((item, i) => (
            <View key={i} style={styles.row}>
              <Text style={styles.appName}>{item.app}</Text>
              <Text style={styles.time}>{Math.floor(item.minutes / 60)}h {item.minutes % 60}m</Text>
              {item.note && <Text style={styles.note}>{item.note}</Text>}
            </View>
          ))}
        </Card>
      );
    case 'insight':
      return (
        <Card style={[styles.card, styles[`insight_${section.severity}`]]}>
          <Text style={styles.title}>{section.title}</Text>
          <Text style={styles.body}>{section.body}</Text>
        </Card>
      );
    case 'pattern':
      return (
        <Card style={styles.card}>
          <Text style={styles.title}>Pattern: {section.title}</Text>
          <Text style={styles.body}>{section.body}</Text>
        </Card>
      );
    case 'win':
      return (
        <Card style={[styles.card, styles.winCard]}>
          <Text style={styles.title}>🎉 {section.title}</Text>
          <Text style={styles.body}>{section.body}</Text>
        </Card>
      );
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginVertical: 8,
    borderRadius: 16,
    backgroundColor: '#1C1C1E',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  body: {
    fontSize: 15,
    color: '#D1D1D6',
    lineHeight: 22,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  appName: {
    color: '#FFF',
    flex: 1,
  },
  time: {
    color: '#8E8E93',
    fontWeight: '600',
  },
  note: {
    color: '#FF9F0A',
    fontSize: 12,
    marginTop: 2,
  },
  insight_info: {
    borderLeftWidth: 4,
    borderLeftColor: '#0A84FF',
  },
  insight_nudge: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF9F0A',
  },
  insight_alert: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF453A',
  },
  winCard: {
    backgroundColor: '#1C2C1E',
    borderLeftWidth: 4,
    borderLeftColor: '#30D158',
  }
});
