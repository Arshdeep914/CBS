import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandLogo } from '@/components/brand-logo';
import { Button } from '@/components/ui/button';
import { Icon, Icons } from '@/components/ui/icon';
import { TextField } from '@/components/ui/text-field';
import { MaxFormWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSession } from '@/store/session';

type FormErrors = { email?: string; password?: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(email: string, password: string): FormErrors {
  const errors: FormErrors = {};
  if (!email.trim()) errors.email = 'Enter your email address.';
  else if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'Enter a valid email address.';
  if (!password) errors.password = 'Enter your password.';
  return errors;
}

export default function LoginScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const passwordRef = useRef<TextInput>(null);
  const { submitSignIn } = useSession();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const nextErrors = validate(email, password);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    // Demo mode: any credentials are accepted. The session change sends the
    // user to the pending-approval screen automatically.
    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 700));
    submitSignIn(email.trim());
  }

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={[styles.flex, { backgroundColor: theme.background }]}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing.four }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: theme.primary, paddingTop: insets.top }]}>
          <View style={[styles.heroCircle, styles.heroCircleLarge]} />
          <View style={[styles.heroCircle, styles.heroCircleSmall]} />
          <Text style={styles.heroEyebrow}>TRADE PORTAL</Text>
        </View>

        <View style={styles.logo}>
          <BrandLogo size={148} />
        </View>

        <View style={styles.body}>
          <View style={styles.heading}>
            <Text style={[styles.title, { color: theme.text }]}>Welcome back</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Sign in to your CBS trade account to browse the catalogue and place orders.
            </Text>
          </View>

          <View style={styles.form}>
            <TextField
              label="Email address"
              icon={Icons.mail}
              placeholder="you@company.com"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                if (errors.email) setErrors({ ...errors, email: undefined });
              }}
              error={errors.email}
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="username"
              returnKeyType="next"
              submitBehavior="submit"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
            <TextField
              ref={passwordRef}
              label="Password"
              icon={Icons.lock}
              placeholder="Enter your password"
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                if (errors.password) setErrors({ ...errors, password: undefined });
              }}
              error={errors.password}
              secureTextEntry
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={handleSubmit}
            />

            <Button title="Sign in" onPress={handleSubmit} loading={submitting} />
          </View>

          <View style={[styles.notice, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Icon name={Icons.shield} color={theme.primary} size={20} />
            <Text style={[styles.noticeText, { color: theme.textSecondary }]}>
              For your security, each new sign-in is reviewed and approved by the CBS team.
            </Text>
          </View>

          <Text style={[styles.footer, { color: theme.textMuted }]}>
            Don’t have an account? Accounts are created by CBS.{'\n'}Contact your sales
            representative to get access.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const HERO_HEIGHT = 210;
const LOGO_OVERLAP = 84;

const styles = StyleSheet.create({
  flex: {
    flex: 1,
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
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    fontWeight: '700',
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
  },
  form: {
    gap: Spacing.three + Spacing.one,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - Spacing.one,
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
  },
  footer: {
    marginTop: 'auto',
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 19,
  },
});
