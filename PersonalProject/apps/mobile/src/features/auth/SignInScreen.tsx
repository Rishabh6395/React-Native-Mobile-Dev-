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
import { Mail, Lock, User as UserIcon, ArrowRight, AlertCircle, Sparkles } from 'lucide-react-native';
import { useTheme } from '../../theme/ThemeContext';
import { Button, Card, SegmentedControl } from '../../components/ui';
import { spacing, typography, layout } from '../../theme/tokens';
import { signInWithEmail, signUpWithEmail, signInWithSocial, SocialProvider } from '../../lib/auth';

// Official SVG Brand Logos
const GoogleIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
    />
    <Path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
    />
    <Path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.97 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
    />
    <Path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
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
      setError(err.message || (mode === 'signup' ? 'Failed to create account' : 'Failed to sign in'));
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = async (provider: SocialProvider) => {
    setSocialLoading(provider);
    setError('');

    try {
      await signInWithSocial(provider);
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
          <View style={[styles.iconWrapper, { backgroundColor: theme.card.highlight }]}>
            <Sparkles size={28} color={theme.accent.violet} />
          </View>
          <Text style={[styles.title, { color: theme.text.primary, fontFamily: typography.fonts.uiSemiBold }]}>
            {mode === 'signin' ? 'Sign in to Hourly' : 'Create an Account'}
          </Text>
          <Text style={[styles.subtitle, { color: theme.text.secondary, fontFamily: typography.fonts.uiRegular }]}>
            {mode === 'signin'
              ? 'Sync your screen time securely across your devices.'
              : 'Join Hourly to take back your focus and screen time.'}
          </Text>
        </View>

        {/* Auth Mode Toggle */}
        <View style={styles.tabContainer}>
          <SegmentedControl
            options={[
              { value: 'signin', label: 'Sign In' },
              { value: 'signup', label: 'Create Account' },
            ]}
            value={mode}
            onChange={(val) => {
              setMode(val);
              setError('');
            }}
          />
        </View>

        {/* Main Card */}
        <Card padding="lg" style={styles.card}>
          {/* Social Auth Providers */}
          <Text style={[styles.socialHeading, { color: theme.text.tertiary, fontFamily: typography.fonts.uiMedium }]}>
            {mode === 'signin' ? 'QUICK SIGN IN' : 'QUICK SIGN UP'}
          </Text>

          <View style={styles.socialRow}>
            {/* Google Button */}
            <Pressable
              style={({ pressed }) => [
                styles.socialButton,
                {
                  backgroundColor: isDark ? theme.card.highlight : theme.card.elevated,
                  borderColor: theme.border.subtle,
                  opacity: pressed || socialLoading ? 0.75 : 1,
                },
              ]}
              onPress={() => handleSocialAuth('google')}
              disabled={socialLoading !== null || loading}
            >
              {socialLoading === 'google' ? (
                <ActivityIndicator size="small" color={theme.text.primary} />
              ) : (
                <>
                  <GoogleIcon size={18} />
                  <Text style={[styles.socialButtonText, { color: theme.text.primary, fontFamily: typography.fonts.uiMedium }]}>
                    Google
                  </Text>
                </>
              )}
            </Pressable>

            {/* GitHub Button */}
            <Pressable
              style={({ pressed }) => [
                styles.socialButton,
                {
                  backgroundColor: isDark ? theme.card.highlight : theme.card.elevated,
                  borderColor: theme.border.subtle,
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
                  <Text style={[styles.socialButtonText, { color: theme.text.primary, fontFamily: typography.fonts.uiMedium }]}>
                    GitHub
                  </Text>
                </>
              )}
            </Pressable>

            {/* Facebook Button */}
            <Pressable
              style={({ pressed }) => [
                styles.socialButton,
                {
                  backgroundColor: isDark ? theme.card.highlight : theme.card.elevated,
                  borderColor: theme.border.subtle,
                  opacity: pressed || socialLoading ? 0.75 : 1,
                },
              ]}
              onPress={() => handleSocialAuth('facebook')}
              disabled={socialLoading !== null || loading}
            >
              {socialLoading === 'facebook' ? (
                <ActivityIndicator size="small" color={theme.text.primary} />
              ) : (
                <>
                  <FacebookIcon size={18} />
                  <Text style={[styles.socialButtonText, { color: theme.text.primary, fontFamily: typography.fonts.uiMedium }]}>
                    Facebook
                  </Text>
                </>
              )}
            </Pressable>
          </View>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: theme.border.subtle }]} />
            <Text style={[styles.dividerText, { color: theme.text.tertiary, fontFamily: typography.fonts.uiRegular }]}>
              or with email
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: theme.border.subtle }]} />
          </View>

          {/* Name Field (Sign Up only) */}
          {mode === 'signup' && (
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <UserIcon size={13} color={theme.text.tertiary} />
                <Text style={[styles.label, { color: theme.text.tertiary, fontFamily: typography.fonts.uiMedium }]}>
                  YOUR NAME
                </Text>
              </View>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: theme.text.primary,
                    backgroundColor: isDark ? theme.card.highlight : theme.card.elevated,
                    borderColor: theme.border.subtle,
                    fontFamily: typography.fonts.uiRegular,
                  },
                ]}
                placeholder="Rishabh Bhatt"
                placeholderTextColor={theme.text.muted}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          )}

          {/* Email Field */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Mail size={13} color={theme.text.tertiary} />
              <Text style={[styles.label, { color: theme.text.tertiary, fontFamily: typography.fonts.uiMedium }]}>
                EMAIL ADDRESS
              </Text>
            </View>
            <TextInput
              style={[
                styles.input,
                {
                  color: theme.text.primary,
                  backgroundColor: isDark ? theme.card.highlight : theme.card.elevated,
                  borderColor: theme.border.subtle,
                  fontFamily: typography.fonts.uiRegular,
                },
              ]}
              placeholder="you@example.com"
              placeholderTextColor={theme.text.muted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          {/* Password Field */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Lock size={13} color={theme.text.tertiary} />
              <Text style={[styles.label, { color: theme.text.tertiary, fontFamily: typography.fonts.uiMedium }]}>
                PASSWORD
              </Text>
            </View>
            <TextInput
              style={[
                styles.input,
                {
                  color: theme.text.primary,
                  backgroundColor: isDark ? theme.card.highlight : theme.card.elevated,
                  borderColor: theme.border.subtle,
                  fontFamily: typography.fonts.uiRegular,
                },
              ]}
              placeholder="••••••••"
              placeholderTextColor={theme.text.muted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {/* Error Banner */}
          {error ? (
            <View style={[styles.errorContainer, { backgroundColor: 'rgba(248, 113, 113, 0.12)', borderColor: theme.semantic.alert }]}>
              <AlertCircle size={16} color={theme.semantic.alert} style={{ marginRight: spacing.xs }} />
              <Text style={[styles.errorText, { color: theme.semantic.alert, fontFamily: typography.fonts.uiMedium }]}>
                {error}
              </Text>
            </View>
          ) : null}

          {/* Primary Action Button */}
          <Button
            title={mode === 'signin' ? 'Sign In' : 'Create Account'}
            onPress={handleEmailAuth}
            loading={loading}
            icon={<ArrowRight size={18} color="#FFFFFF" />}
            iconPosition="right"
            fullWidth
            style={{ marginTop: spacing.sm }}
          />

          {/* Switch Mode Prompt */}
          <Pressable
            style={styles.switchModePrompt}
            onPress={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setError('');
            }}
          >
            <Text style={[styles.switchModeText, { color: theme.text.secondary, fontFamily: typography.fonts.uiRegular }]}>
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <Text style={{ color: theme.accent.violet, fontFamily: typography.fonts.uiSemiBold }}>
                {mode === 'signin' ? 'Sign Up' : 'Sign In'}
              </Text>
            </Text>
          </Pressable>
        </Card>

        {/* Footer / Skip */}
        <View style={styles.footer}>
          <Button
            title="Skip for now"
            variant="ghost"
            onPress={onComplete}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: layout.screenPadding,
    paddingVertical: spacing.xxl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.scale.xl,
    marginBottom: spacing.xs,
    includeFontPadding: false,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.scale.sm,
    textAlign: 'center',
    includeFontPadding: false,
    maxWidth: 290,
    lineHeight: 20,
  },
  tabContainer: {
    marginBottom: spacing.md,
  },
  card: {
    marginBottom: spacing.lg,
  },
  socialHeading: {
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: spacing.sm,
    includeFontPadding: false,
    textAlign: 'center',
  },
  socialRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  socialButton: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: layout.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  socialButtonText: {
    fontSize: 12,
    includeFontPadding: false,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
    gap: spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 11,
    includeFontPadding: false,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: 11,
    letterSpacing: 0.8,
    includeFontPadding: false,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: layout.borderRadius.md,
    paddingHorizontal: spacing.md,
    fontSize: typography.scale.base,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: layout.borderRadius.sm,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: typography.scale.xs,
    includeFontPadding: false,
    flex: 1,
  },
  switchModePrompt: {
    marginTop: spacing.md,
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  switchModeText: {
    fontSize: typography.scale.xs,
    includeFontPadding: false,
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.xs,
  },
});
