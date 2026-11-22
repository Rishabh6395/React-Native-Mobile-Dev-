import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Mail,
  Lock,
  User as UserIcon,
  ArrowRight,
  AlertCircle,
  Clock,
  UserCircle,
  ChevronRight,
} from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Button, Card, GlowCard } from '../../components/ui';
import { spacing, typography, layout, glassShadow } from '../../theme/tokens';
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithSocial,
  setGuestMode,
  SocialProvider,
} from '../../lib/auth';

// ─── SVG Brand Logos ─────────────────────────────────────────

const GoogleIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
    <Path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
    <Path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.97 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
    <Path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
  </Svg>
);

const GithubIcon: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
  </Svg>
);

const FacebookIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="#1877F2">
    <Path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </Svg>
);

export const SignInScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const { theme, isDark } = useTheme();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<SocialProvider | null>(null);
  const [error, setError] = useState('');

  const handleGuest = async () => {
    try {
      await setGuestMode(true);
    } catch {}
    onComplete();
  };

  const validate = (): boolean => {
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (mode === 'signup' && !name.trim()) {
      setError('Please enter your name');
      return false;
    }
    return true;
  };

  const handleEmailAuth = async () => {
    if (!validate()) return;
    setLoading(true);
    setError('');
    try {
      if (mode === 'signup') {
        await signUpWithEmail(email, password, name);
      } else {
        await signInWithEmail(email, password);
      }
      onComplete();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = async (provider: SocialProvider) => {
    setSocialLoading(provider);
    setError('');
    try {
      await signInWithSocial(provider);
      onComplete();
    } catch (err: any) {
      setError(err.message || `Failed to sign in with ${provider}`);
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header Branding */}
        <View style={styles.header}>
          <View style={[styles.heroIconOuter, glassShadow]}>
            <LinearGradient
              colors={theme.accent.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroIconGradient}
            >
              <Clock size={28} color="#FFFFFF" strokeWidth={2.5} />
            </LinearGradient>
          </View>
          <Text style={[styles.title, { color: theme.text.primary }]}>
            Welcome to Hourly
          </Text>
          <Text style={[styles.subtitle, { color: theme.text.secondary }]}>
            Your screen time, explained · Take back your focus
          </Text>
        </View>

        {/* 1. Quick Guest Access (Prominent) */}
        <Pressable
          style={({ pressed }) => [
            styles.guestCard,
            {
              backgroundColor: theme.card.base,
              borderColor: theme.border.glass,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
          onPress={handleGuest}
        >
          <View style={[styles.guestIconCircle, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
            <UserCircle size={24} color={theme.accent.violet} />
          </View>
          <View style={styles.guestTextCol}>
            <Text style={[styles.guestTitle, { color: theme.text.primary }]}>
              Continue as Guest
            </Text>
            <Text style={[styles.guestDesc, { color: theme.text.tertiary }]}>
              No account needed · Instant local access
            </Text>
          </View>
          <ChevronRight size={18} color={theme.text.muted} />
        </Pressable>

        {/* 2. Social Login Section */}
        <View style={styles.sectionDivider}>
          <View style={[styles.dividerLine, { backgroundColor: theme.border.glass }]} />
          <Text style={[styles.dividerLabel, { color: theme.text.tertiary }]}>
            OR CONTINUE WITH
          </Text>
          <View style={[styles.dividerLine, { backgroundColor: theme.border.glass }]} />
        </View>

        <View style={styles.socialRow}>
          {/* Google */}
          <Pressable
            style={({ pressed }) => [
              styles.socialButton,
              {
                backgroundColor: theme.card.base,
                borderColor: theme.border.glass,
                opacity: pressed || socialLoading ? 0.75 : 1,
              },
            ]}
            onPress={() => handleSocialAuth('google')}
            disabled={socialLoading !== null || loading}
          >
            {socialLoading === 'google' ? (
              <ActivityIndicator size="small" color="#4285F4" />
            ) : (
              <>
                <GoogleIcon size={18} />
                <Text style={[styles.socialText, { color: theme.text.primary }]}>
                  Google
                </Text>
              </>
            )}
          </Pressable>

          {/* GitHub */}
          <Pressable
            style={({ pressed }) => [
              styles.socialButton,
              {
                backgroundColor: theme.card.base,
                borderColor: theme.border.glass,
                opacity: pressed || socialLoading ? 0.75 : 1,
              },
            ]}
            onPress={() => handleSocialAuth('github')}
            disabled={socialLoading !== null || loading}
          >
            {socialLoading === 'github' ? (
              <ActivityIndicator size="small" color={theme.text.primary} />
            ) : (
              <>
                <GithubIcon size={18} color={theme.text.primary} />
                <Text style={[styles.socialText, { color: theme.text.primary }]}>
                  GitHub
                </Text>
              </>
            )}
          </Pressable>

          {/* Facebook */}
          <Pressable
            style={({ pressed }) => [
              styles.socialButton,
              {
                backgroundColor: theme.card.base,
                borderColor: theme.border.glass,
                opacity: pressed || socialLoading ? 0.75 : 1,
              },
            ]}
            onPress={() => handleSocialAuth('facebook')}
            disabled={socialLoading !== null || loading}
          >
            {socialLoading === 'facebook' ? (
              <ActivityIndicator size="small" color="#1877F2" />
            ) : (
              <>
                <FacebookIcon size={18} />
                <Text style={[styles.socialText, { color: theme.text.primary }]}>
                  Facebook
                </Text>
              </>
            )}
          </Pressable>
        </View>

        {/* 3. Email & Password Form Section */}
        <View style={styles.sectionDivider}>
          <View style={[styles.dividerLine, { backgroundColor: theme.border.glass }]} />
          <Text style={[styles.dividerLabel, { color: theme.text.tertiary }]}>
            OR WITH EMAIL & PASSWORD
          </Text>
          <View style={[styles.dividerLine, { backgroundColor: theme.border.glass }]} />
        </View>

        <Card padding="base" style={styles.formCard}>
          {/* Mode Switcher Tabs */}
          <View style={styles.modeToggleRow}>
            <Pressable
              style={[
                styles.modeTab,
                mode === 'signin' && {
                  backgroundColor: theme.card.highlight,
                  borderColor: theme.border.active,
                },
              ]}
              onPress={() => {
                setMode('signin');
                setError('');
              }}
            >
              <Text
                style={[
                  styles.modeTabText,
                  {
                    color: mode === 'signin' ? theme.text.primary : theme.text.tertiary,
                    fontWeight: mode === 'signin' ? '600' : '400',
                  },
                ]}
              >
                Sign In
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.modeTab,
                mode === 'signup' && {
                  backgroundColor: theme.card.highlight,
                  borderColor: theme.border.active,
                },
              ]}
              onPress={() => {
                setMode('signup');
                setError('');
              }}
            >
              <Text
                style={[
                  styles.modeTabText,
                  {
                    color: mode === 'signup' ? theme.text.primary : theme.text.tertiary,
                    fontWeight: mode === 'signup' ? '600' : '400',
                  },
                ]}
              >
                Create Account
              </Text>
            </Pressable>
          </View>

          {/* Name Field (Sign Up only) */}
          {mode === 'signup' && (
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.text.tertiary }]}>
                YOUR NAME
              </Text>
              <View
                style={[
                  styles.inputBox,
                  {
                    backgroundColor: theme.card.highlight,
                    borderColor: theme.border.glass,
                  },
                ]}
              >
                <UserIcon size={16} color={theme.text.muted} />
                <TextInput
                  style={[styles.inputField, { color: theme.text.primary }]}
                  placeholder="Rishabh Bhatt"
                  placeholderTextColor={theme.text.muted}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            </View>
          )}

          {/* Email Field */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.text.tertiary }]}>
              EMAIL ADDRESS
            </Text>
            <View
              style={[
                styles.inputBox,
                {
                  backgroundColor: theme.card.highlight,
                  borderColor: theme.border.glass,
                },
              ]}
            >
              <Mail size={16} color={theme.text.muted} />
              <TextInput
                style={[styles.inputField, { color: theme.text.primary }]}
                placeholder="you@example.com"
                placeholderTextColor={theme.text.muted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>

          {/* Password Field */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.text.tertiary }]}>
              PASSWORD
            </Text>
            <View
              style={[
                styles.inputBox,
                {
                  backgroundColor: theme.card.highlight,
                  borderColor: theme.border.glass,
                },
              ]}
            >
              <Lock size={16} color={theme.text.muted} />
              <TextInput
                style={[styles.inputField, { color: theme.text.primary }]}
                placeholder="••••••••"
                placeholderTextColor={theme.text.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          {/* Error Message */}
          {error ? (
            <View
              style={[
                styles.errorContainer,
                {
                  backgroundColor: 'rgba(248, 113, 113, 0.12)',
                  borderColor: theme.semantic.alert,
                },
              ]}
            >
              <AlertCircle size={15} color={theme.semantic.alert} style={{ marginRight: spacing.xs }} />
              <Text style={[styles.errorText, { color: theme.semantic.alert }]}>
                {error}
              </Text>
            </View>
          ) : null}

          {/* Submit Button */}
          <Button
            title={mode === 'signin' ? 'Sign In' : 'Create Account'}
            onPress={handleEmailAuth}
            loading={loading}
            fullWidth
            icon={<ArrowRight size={18} color="#FFFFFF" />}
            iconPosition="right"
            style={{ marginTop: spacing.sm }}
          />
        </Card>

        {/* Footer Note */}
        <Text style={[styles.footerText, { color: theme.text.muted }]}>
          By continuing, you agree to Hourly's Terms of Service and Privacy Policy.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ─── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: 56,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  heroIconOuter: {
    marginBottom: spacing.md,
  },
  heroIconGradient: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    includeFontPadding: false,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    includeFontPadding: false,
  },
  // Guest Card
  guestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    borderRadius: layout.borderRadius.card,
    borderWidth: 1,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  guestIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestTextCol: {
    flex: 1,
  },
  guestTitle: {
    fontSize: 16,
    fontWeight: '600',
    includeFontPadding: false,
    marginBottom: 2,
  },
  guestDesc: {
    fontSize: 12,
    fontWeight: '400',
    includeFontPadding: false,
  },
  // Dividers
  sectionDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    includeFontPadding: false,
  },
  // Social row
  socialRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  socialButton: {
    flex: 1,
    height: 46,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  socialText: {
    fontSize: 13,
    fontWeight: '600',
    includeFontPadding: false,
  },
  // Email Form Card
  formCard: {
    marginBottom: spacing.lg,
  },
  modeToggleRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: layout.borderRadius.sm,
    padding: 3,
    marginBottom: spacing.base,
  },
  modeTab: {
    flex: 1,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: layout.borderRadius.sm - 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modeTabText: {
    fontSize: 13,
    includeFontPadding: false,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8,
    marginBottom: 6,
    includeFontPadding: false,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: layout.borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  inputField: {
    flex: 1,
    fontSize: 15,
    includeFontPadding: false,
    height: '100%',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: layout.borderRadius.sm,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '500',
    includeFontPadding: false,
    flex: 1,
  },
  footerText: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    includeFontPadding: false,
    paddingHorizontal: spacing.xl,
  },
});
