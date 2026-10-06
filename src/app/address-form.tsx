import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { errorMessage } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icon';
import { ScreenHeader } from '@/components/ui/screen-header';
import { AppText } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { toast } from '@/components/ui/toast';
import { MaxFormWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { AddressInput } from '@/services/types';
import { addressActions, useAddresses } from '@/store/addresses';
import { useSession } from '@/store/session';

type Errors = Partial<Record<keyof AddressInput, string>>;

function validate(values: AddressInput): Errors {
  const errors: Errors = {};
  if (!values.fullName.trim()) errors.fullName = 'Enter the recipient’s name.';
  if (!/^\d{10}$/.test(values.mobile)) errors.mobile = 'Enter a 10-digit mobile number.';
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) errors.email = 'Enter a valid email.';
  if (!values.line1.trim()) errors.line1 = 'Enter the house / flat and street.';
  if (!values.city.trim()) errors.city = 'Enter the city.';
  if (!values.state.trim()) errors.state = 'Enter the state.';
  if (!/^\d{6}$/.test(values.pinCode)) errors.pinCode = 'Enter a 6-digit PIN code.';
  return errors;
}

export default function AddressFormScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useSession();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = useAddresses().items.find((a) => a.id === id);

  const [values, setValues] = useState<AddressInput>(() => ({
    fullName: existing?.fullName ?? user?.name ?? '',
    mobile: existing?.mobile ?? '',
    email: existing?.email ?? user?.email ?? '',
    line1: existing?.line1 ?? '',
    line2: existing?.line2 ?? '',
    landmark: existing?.landmark ?? '',
    city: existing?.city ?? '',
    state: existing?.state ?? '',
    pinCode: existing?.pinCode ?? '',
  }));
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  const set = (key: keyof AddressInput) => (value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  async function save() {
    const next = validate(values);
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setSaving(true);
    try {
      await addressActions.save(
        { ...values, fullName: values.fullName.trim(), email: values.email.trim() },
        existing?.id,
      );
      toast.show(existing ? 'Address updated' : 'Address saved', 'success');
      router.back();
    } catch (err) {
      toast.show(errorMessage(err, "Couldn't save that address."), 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView behavior="padding" style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScreenHeader title={existing ? 'Edit address' : 'New address'} />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.five }]}>
        <AppText variant="overline" color="textMuted">
          CONTACT
        </AppText>
        <TextField label="Full name" icon={Icons.person} value={values.fullName} onChangeText={set('fullName')} error={errors.fullName} autoComplete="name" />
        <TextField
          label="Mobile number"
          icon={Icons.call}
          value={values.mobile}
          onChangeText={(v) => set('mobile')(v.replace(/\D/g, '').slice(0, 10))}
          error={errors.mobile}
          keyboardType="number-pad"
          autoComplete="tel"
        />
        <TextField
          label="Email (optional)"
          icon={Icons.mail}
          value={values.email}
          onChangeText={set('email')}
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />

        <AppText variant="overline" color="textMuted" style={styles.groupTitle}>
          ADDRESS
        </AppText>
        <TextField label="House / flat, street" icon={Icons.home} value={values.line1} onChangeText={set('line1')} error={errors.line1} autoComplete="street-address" />
        <TextField label="Area, sector (optional)" icon={Icons.location} value={values.line2} onChangeText={set('line2')} />
        <TextField label="Landmark (optional)" icon={Icons.location} value={values.landmark} onChangeText={set('landmark')} />
        <View style={styles.row}>
          <View style={styles.flex}>
            <TextField label="City" icon={Icons.store} value={values.city} onChangeText={set('city')} error={errors.city} />
          </View>
          <View style={styles.pin}>
            <TextField
              label="PIN code"
              icon={Icons.location}
              value={values.pinCode}
              onChangeText={(v) => set('pinCode')(v.replace(/\D/g, '').slice(0, 6))}
              error={errors.pinCode}
              keyboardType="number-pad"
              autoComplete="postal-code"
            />
          </View>
        </View>
        <TextField label="State" icon={Icons.location} value={values.state} onChangeText={set('state')} error={errors.state} />

        <Button title={existing ? 'Save changes' : 'Save address'} onPress={save} loading={saving} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: MaxFormWidth,
    alignSelf: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  groupTitle: {
    marginTop: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.three - 4,
  },
  pin: {
    width: 140,
  },
});
