/**
 * Coach Screen — Placeholder for Phase 6
 * Shows a coming-soon state until AI chat coach is built.
 */

import React from 'react';
import { MessageCircle } from 'lucide-react-native';
import { useTheme } from '../../src/theme/ThemeContext';
import { Screen, Header, EmptyState } from '../../src/components/ui';

export default function CoachScreen() {
  const { theme } = useTheme();

  return (
    <Screen
      scrollable
      header={<Header title="Coach" largeTitle />}
    >
      <EmptyState
        icon={<MessageCircle size={48} color={theme.accent.violet} />}
        title="AI Coach Coming Soon"
        description="Chat with your personal screen time coach. Get content swap suggestions, build gradual reduction plans, and track what you watch."
      />
    </Screen>
  );
}
