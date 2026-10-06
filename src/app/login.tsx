import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { errorMessage } from '@/api/client';
import { BrandLogo } from '@/components/brand-logo';
import { Button } from '@/components/ui/button';
import { Icon, Icons } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { toast } from '@/components/ui/toast';
import { Env } from '@/config/env';
import { MaxFormWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { shop } from '@/services';
import { useSession } from '@/store/session';

type Mode = 'signin' | 'register' | 'verify' | 'forgot' | 'reset' | 'emailed';

/** Minimum length for a sign-up password, as on the storefront. */
const MIN_SIGNUP_PASSWORD = 6;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The backend's password policy, checked here so we fail fast. */
function passwordProblem(password: string) {
  if (password.length < 8) return 'Use at least 8 characters.';
  if (!/[a-z]/.test(password)) return 'Include a lowercase letter.';
  if (!/[A-Z]/.test(password)) return 'Include an uppercase letter.';
  if (!/\d/.test(password)) return 'Include a number.';
  if (!/[@$!%*?&]/.test(password)) return 'Include a special character (@$!%*?&).';
  return null;
}

const TITLES: Record<Mode, { title: string; subtitle: string }> = {
  signin: { title: 'Welcome back', subtitle: 'Sign in to shop, track orders and check out faster.' },
  register: { title: 'Create your account', subtitle: 'Choose a password, then verify your email with a 6-digit code.' },
  verify: { title: 'Verify your email', subtitle: 'Enter the 6-digit code we just emailed you to finish signing up.' },
  forgot: { title: 'Reset your password', subtitle: 'Choose a new password — we’ll verify it’s you by email.' },
  reset: { title: 'Enter the code', subtitle: 'We’ve emailed you a 6-digit code to confirm the change.' },
  emailed: { title: 'Check your inbox', subtitle: '' },
};

export default function LoginScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { signIn } = useSession();
  const passwordRef = useRef<TextInput>(null);

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function go(next: Mode) {
    setError(null);
    setOtp('');
    setMode(next);
  }

  /** Opens a form that sets a new password, without carrying over what was typed elsewhere. */
  function startFresh(next: 'register' | 'forgot') {
    setPassword('');
    setNewPassword('');
    setConfirmPassword('');
    go(next);
  }

  async function attempt(action: () => Promise<void>, fallback: string) {
    setSubmitting(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(errorMessage(err, fallback));
    } finally {
      setSubmitting(false);
    }
  }

  function handleSignIn() {
    if (!EMAIL.test(email.trim())) return setError('Enter a valid email address.');
    if (!password) return setError('Enter your password.');
    // the session change sends the user into the app
    void attempt(() => signIn(email.trim(), password), 'Sign-in failed. Please check your details.');
  }

  function handleRegister() {
    if (!name.trim()) return setError('Enter your name.');
    if (!EMAIL.test(email.trim())) return setError('Enter a valid email address.');
    if (!/^\d{10}$/.test(mobile)) return setError('Enter a valid 10-digit mobile number.');
    if (password.length < MIN_SIGNUP_PASSWORD) return setError(`Use at least ${MIN_SIGNUP_PASSWORD} characters for your password.`);
    if (password !== confirmPassword) return setError('Those passwords don’t match.');
    void attempt(async () => {
      const result = await shop.auth.register({
        name: name.trim(),
        email: email.trim(),
        mobile,
        password,
        confirmPassword,
      });
      setToken(result.token);
      toast.show(result.message || 'We’ve sent you a verification code.', 'success');
      go('verify');
    }, 'Registration failed. Please try again.');
  }

  function handleVerify() {
    if (!/^\d{6}$/.test(otp)) return setError('Enter the full 6-digit code.');
    void attempt(async () => {
      await shop.auth.verifyRegistration(email.trim(), otp, token);
      // verified: sign straight in with the password they just chose
      try {
        await signIn(email.trim(), password);
        toast.show('Account created — welcome to CBS Kitchenware!', 'success');
      } catch {
        // the account exists; only the automatic sign-in failed
        toast.show('Your account is ready. Please sign in to continue.', 'info');
        go('signin');
      }
    }, 'That code didn’t work. Please try again.');
  }

  function handleForgot() {
    if (!EMAIL.test(email.trim())) return setError('Enter the email address on your account.');
    const problem = passwordProblem(newPassword);
    if (problem) return setError(problem);
    if (newPassword !== confirmPassword) return setError('Those passwords don’t match.');
    void attempt(async () => {
      const result = await shop.auth.requestPasswordReset(email.trim(), newPassword);
      if (!result.otpSent) return go('emailed');
      setToken(result.token);
      toast.show(result.message || 'We’ve sent you a verification code.', 'success');
      go('reset');
    }, 'Couldn’t start the password reset.');
  }

  function handleReset() {
    if (!/^\d{6}$/.test(otp)) return setError('Enter the full 6-digit code.');
    void attempt(async () => {
      await shop.auth.confirmPasswordReset(email.trim(), otp, newPassword, token);
      toast.show('Password updated — you can sign in now.', 'success');
      setPassword('');
      go('signin');
    }, 'That code didn’t work. Please try again.');
  }

  const { title, subtitle } = TITLES[mode];

  return (
    <KeyboardAvoidingView behavior="padding" style={[styles.flex, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing.four }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: theme.primary, paddingTop: insets.top }]}>
          <View style={[styles.heroCircle, styles.heroCircleLarge]} />
          <View style={[styles.heroCircle, styles.heroCircleSmall]} />
          <AppText variant="overline" color="rgba(255,255,255,0.85)" style={styles.heroEyebrow}>
            DESIGNER FOR YOUR KITCHEN
          </AppText>
        </View>

        <View style={styles.logo}>
          <BrandLogo size={148} />
        </View>

        <Animated.View key={mode} entering={FadeIn.duration(220)} style={styles.body}>
          <View style={styles.heading}>
            {mode !== 'signin' && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back to sign in"
                hitSlop={10}
                onPress={() => go('signin')}
                style={styles.back}>
                <Icon name={Icons.back} color={theme.textSecondary} size={14} weight="semibold" />
                <AppText variant="captionStrong" color="textSecondary">
                  Back to sign in
                </AppText>
              </Pressable>
            )}
            <AppText variant="display">{title}</AppText>
            {!!subtitle && <AppText color="textSecondary">{subtitle}</AppText>}
          </View>

          {Env.offline && mode === 'signin' && (
            <View style={[styles.notice, { backgroundColor: theme.warningSoft, borderColor: theme.warningSoft }]}>
              <Icon name={Icons.info} color={theme.warning} size={18} />
              <AppText variant="caption" color="warning" style={styles.flex}>
                Offline demo (no API URL set) — any email and password will sign you in.
              </AppText>
            </View>
          )}

          <View style={styles.form}>
            {mode === 'signin' && (
              <>
                <EmailField value={email} onChange={setEmail} onSubmit={() => passwordRef.current?.focus()} />
                <TextField
                  ref={passwordRef}
                  label="Password"
                  icon={Icons.lock}
                  placeholder="Your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="current-password"
                  textContentType="password"
                  returnKeyType="go"
                  onSubmitEditing={handleSignIn}
                />
                <Pressable onPress={() => startFresh('forgot')} hitSlop={8} style={styles.link}>
                  <AppText variant="captionStrong" color="primary">
                    Forgot password?
                  </AppText>
                </Pressable>
                <ErrorLine error={error} />
                <Button title="Sign in" onPress={handleSignIn} loading={submitting} />
              </>
            )}

            {mode === 'register' && (
              <>
                <TextField
                  label="Full name"
                  icon={Icons.person}
                  placeholder="Your name"
                  value={name}
                  onChangeText={setName}
                  autoComplete="name"
                  textContentType="name"
                />
                <EmailField value={email} onChange={setEmail} />
                <TextField
                  label="Mobile number"
                  icon={Icons.call}
                  placeholder="10-digit number"
                  value={mobile}
                  onChangeText={(v) => setMobile(v.replace(/\D/g, '').slice(0, 10))}
                  keyboardType="number-pad"
                  autoComplete="tel"
                  textContentType="telephoneNumber"
                />
                <TextField
                  label="Password"
                  icon={Icons.lock}
                  placeholder={`At least ${MIN_SIGNUP_PASSWORD} characters`}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="new-password"
                  textContentType="newPassword"
                />
                <TextField
                  label="Confirm password"
                  icon={Icons.lock}
                  placeholder="Type it once more"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoComplete="new-password"
                  returnKeyType="go"
                  onSubmitEditing={handleRegister}
                />
                <ErrorLine error={error} />
                <Button title="Create account" onPress={handleRegister} loading={submitting} />
              </>
            )}

            {(mode === 'verify' || mode === 'reset') && (
              <>
                <AppText color="textSecondary">
                  Code sent to <AppText variant="bodyStrong">{email.trim()}</AppText>
                </AppText>
                <TextField
                  label="6-digit code"
                  icon={Icons.shield}
                  placeholder="••••••"
                  value={otp}
                  onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))}
                  keyboardType="number-pad"
                  autoComplete="one-time-code"
                  textContentType="oneTimeCode"
                  returnKeyType="go"
                  onSubmitEditing={mode === 'verify' ? handleVerify : handleReset}
                />
                <ErrorLine error={error} />
                <Button
                  title={mode === 'verify' ? 'Verify & sign in' : 'Update password'}
                  onPress={mode === 'verify' ? handleVerify : handleReset}
                  loading={submitting}
                />
                {mode === 'verify' && (
                  <Button title="Resend code" variant="ghost" onPress={handleRegister} disabled={submitting} />
                )}
              </>
            )}

            {mode === 'forgot' && (
              <>
                <EmailField value={email} onChange={setEmail} />
                <TextField
                  label="New password"
                  icon={Icons.lock}
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  autoComplete="new-password"
                  textContentType="newPassword"
                />
                <TextField
                  label="Confirm new password"
                  icon={Icons.lock}
                  placeholder="Type it once more"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoComplete="new-password"
                  returnKeyType="go"
                  onSubmitEditing={handleForgot}
                />
                <AppText variant="caption" color="textMuted">
                  Use 8+ characters with upper and lowercase letters, a number and a symbol (@$!%*?&).
                </AppText>
                <ErrorLine error={error} />
                <Button title="Send code" onPress={handleForgot} loading={submitting} />
              </>
            )}

            {mode === 'emailed' && (
              <>
                <View style={[styles.success, { backgroundColor: theme.successSoft }]}>
                  <Icon name={Icons.mail} color={theme.success} size={28} />
                  <AppText style={styles.center}>
                    We’ve emailed your current password to <AppText variant="bodyStrong">{email.trim()}</AppText>.
                  </AppText>
                </View>
                <Button
                  title="Sign in"
                  onPress={() => {
                    setPassword('');
                    go('signin');
                  }}
                />
              </>
            )}
          </View>

          {mode === 'signin' && (
            <View style={styles.footer}>
              <AppText color="textSecondary">New to CBS Kitchenware?</AppText>
              <Pressable onPress={() => startFresh('register')} hitSlop={8}>
                <AppText variant="bodyStrong" color="primary">
                  Create an account
                </AppText>
              </Pressable>
            </View>
          )}
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function EmailField({ value, onChange, onSubmit }: { value: string; onChange: (v: string) => void; onSubmit?: () => void }) {
  return (
    <TextField
      label="Email address"
      icon={Icons.mail}
      placeholder="you@example.com"
      value={value}
      onChangeText={onChange}
      autoCapitalize="none"
      autoComplete="email"
      autoCorrect={false}
      keyboardType="email-address"
      textContentType="username"
      returnKeyType={onSubmit ? 'next' : 'done'}
      submitBehavior={onSubmit ? 'submit' : undefined}
      onSubmitEditing={onSubmit}
    />
  );
}

function ErrorLine({ error }: { error: string | null }) {
  const theme = useTheme();
  if (!error) return null;
  return (
    <View style={[styles.error, { backgroundColor: theme.primarySoft }]}>
      <Icon name={Icons.alert} color={theme.danger} size={18} />
      <AppText variant="bodyStrong" color="danger" style={styles.flex}>
        {error}
      </AppText>
    </View>
  );
}

const HERO_HEIGHT = 210;
const LOGO_OVERLAP = 84;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    textAlign: 'center',
  },
  scroll: {
    flexGrow: 1,
  },
  hero: {
    minHeight: HERO_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: LOGO_OVERLAP - Spacing.three,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: 'hidden',
  },
  heroCircle: {
    position: 'absolute',
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
  },
  heroCircleLarge: {
    width: 320,
    height: 320,
    top: -170,
    right: -110,
  },
  heroCircleSmall: {
    width: 180,
    height: 180,
    bottom: -90,
    left: -60,
  },
  heroEyebrow: {
    letterSpacing: 3,
  },
  logo: {
    alignItems: 'center',
    marginTop: -LOGO_OVERLAP,
  },
  body: {
    flex: 1,
    width: '100%',
    maxWidth: MaxFormWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    gap: Spacing.four,
  },
  heading: {
    gap: Spacing.two,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: Spacing.one,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two + 2,
    padding: Spacing.three - 2,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  form: {
    gap: Spacing.three + Spacing.one,
  },
  link: {
    alignSelf: 'flex-end',
    marginTop: -Spacing.two,
  },
  error: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.three - 2,
    borderRadius: Radius.md,
  },
  success: {
    alignItems: 'center',
    gap: Spacing.two + 2,
    padding: Spacing.four,
    borderRadius: Radius.lg,
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
    gap: 4,
    paddingTop: Spacing.three,
  },
});
