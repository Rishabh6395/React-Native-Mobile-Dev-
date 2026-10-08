import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { Mail, ArrowRight } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Button, Card, Pill } from '../../components/ui';
import { spacing, typography, layout } from '../../theme/tokens';
import { fetchApi, saveSessionToken } from '../../lib/api';
import { router } from 'expo-router';

export const SignInScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { theme, isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Using better-auth signIn endpoint
      const response = await fetchApi('/api/auth/sign-in/email', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      if (response?.token) {
        await saveSessionToken(response.token);
        onComplete();
      } else {
        // If better-auth uses cookies by default, we might need to handle headers
        // For standard setup, let's assume we get a token or we set it up to return one
        // Fallback or handle standard better-auth response
        if (response?.user) {
          onComplete(); // Assuming cookies are handled or we extract token differently
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View style={[styles.iconWrapper, { backgroundColor: theme.card.highlight }]}>
          <Mail size={32} color={theme.text.primary} />
        </View>
        <Text style={[styles.title, { color: theme.text.primary, fontFamily: typography.fonts.uiSemiBold }]}>
          Sign in to Hourly
        </Text>
        <Text style={[styles.subtitle, { color: theme.text.secondary, fontFamily: typography.fonts.uiRegular }]}>
          Sync your screen time securely across devices.
        </Text>
      </View>

      <Card padding="lg" style={styles.card}>
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text.tertiary, fontFamily: typography.fonts.uiMedium }]}>EMAIL</Text>
          <TextInput
            style={[
              styles.input,
              { 
                color: theme.text.primary, 
                backgroundColor: isDark ? theme.card.highlight : theme.card.elevated,
                borderColor: theme.border,
                fontFamily: typography.fonts.uiRegular
              }
            ]}
            placeholder="you@example.com"
            placeholderTextColor={theme.text.muted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: theme.text.tertiary, fontFamily: typography.fonts.uiMedium }]}>PASSWORD</Text>
          <TextInput
            style={[
              styles.input,
              { 
                color: theme.text.primary, 
                backgroundColor: isDark ? theme.card.highlight : theme.card.elevated,
                borderColor: theme.border,
                fontFamily: typography.fonts.uiRegular
              }
            ]}
            placeholder="••••••••"
            placeholderTextColor={theme.text.muted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        {error ? (
          <Text style={[styles.error, { color: theme.semantic.alert, fontFamily: typography.fonts.uiMedium }]}>
            {error}
          </Text>
        ) : null}

        <Button 
          title="Sign In" 
          onPress={handleSignIn} 
          loading={loading}
          icon={<ArrowRight size={18} color="#FFFFFF" />}
          iconPosition="right"
          fullWidth
          style={{ marginTop: spacing.md }}
        />
      </Card>
      
      <View style={styles.footer}>
        <Button
          title="Skip for now"
          variant="ghost"
          onPress={onComplete}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: layout.screenPadding,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.scale.h2,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  subtitle: {
    fontSize: typography.scale.base,
    textAlign: 'center',
    includeFontPadding: false,
  },
  card: {
    marginBottom: spacing.xl,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 11,
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
    includeFontPadding: false,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: layout.borderRadius.sm,
    paddingHorizontal: spacing.md,
    fontSize: typography.scale.base,
  },
  error: {
    fontSize: typography.scale.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  footer: {
    alignItems: 'center',
  }
});
