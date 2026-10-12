import type { ReactNode } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { Icon, Icons, type IconName } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { MaxFormWidth, Radius, Spacing } from '@/constants/theme';
import { COMPANY } from '@/constants/company';
import { useTheme } from '@/hooks/use-theme';

/** Building blocks for the static content pages (Help, Returns, Terms & privacy, About). */

export function PageBody({ children }: { children: ReactNode }) {
  return <View style={styles.body}>{children}</View>;
}

/** A titled card. */
export function Section({ title, icon, children }: { title: string; icon?: IconName; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.sectionTitle}>
        {icon && (
          <View style={[styles.sectionIcon, { backgroundColor: theme.primarySoft }]}>
            <Icon name={icon} color={theme.primary} size={16} />
          </View>
        )}
        <AppText variant="subheading" style={styles.flex}>
          {title}
        </AppText>
      </View>
      {children}
    </View>
  );
}

export function Para({ children }: { children: ReactNode }) {
  return (
    <AppText color="textSecondary" style={styles.para}>
      {children}
    </AppText>
  );
}

export function Bullets({ items }: { items: ReactNode[] }) {
  const theme = useTheme();
  return (
    <View style={styles.bullets}>
      {items.map((item, index) => (
        <View key={index} style={styles.bulletRow}>
          <View style={[styles.dot, { backgroundColor: theme.primary }]} />
          <AppText color="textSecondary" style={[styles.flex, styles.para]}>
            {item}
          </AppText>
        </View>
      ))}
    </View>
  );
}

/** Numbered steps, e.g. how to request a return. */
export function Steps({ items }: { items: ReactNode[] }) {
  const theme = useTheme();
  return (
    <View style={styles.bullets}>
      {items.map((item, index) => (
        <View key={index} style={styles.bulletRow}>
          <View style={[styles.stepNo, { backgroundColor: theme.primarySoft }]}>
            <AppText variant="captionStrong" color="primary">
              {index + 1}
            </AppText>
          </View>
          <AppText color="textSecondary" style={[styles.flex, styles.para]}>
            {item}
          </AppText>
        </View>
      ))}
    </View>
  );
}

/** Tappable row that opens another page or app. */
export function LinkRow({ icon, label, detail, onPress }: { icon: IconName; label: string; detail?: string; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="link"
      onPress={onPress}
      style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.6 }]}>
      <Icon name={icon} color={theme.textSecondary} size={18} />
      <View style={styles.flex}>
        <AppText variant="bodyStrong">{label}</AppText>
        {detail && (
          <AppText variant="caption" color="textMuted" numberOfLines={1}>
            {detail}
          </AppText>
        )}
      </View>
      <Icon name={Icons.chevronRight} color={theme.textMuted} size={12} weight="bold" />
    </Pressable>
  );
}

/**
 * Email / phone / WhatsApp rows from COMPANY — only the ones that are filled in.
 * Renders nothing if no contact detail is set yet.
 */
export function ContactRows() {
  const rows: { icon: IconName; label: string; detail: string; url: string }[] = [];
  if (COMPANY.supportEmail) {
    rows.push({ icon: Icons.mail, label: 'Email us', detail: COMPANY.supportEmail, url: `mailto:${COMPANY.supportEmail}` });
  }
  if (COMPANY.supportPhone) {
    rows.push({ icon: Icons.call, label: 'Call us', detail: COMPANY.supportPhone, url: `tel:${COMPANY.supportPhone.replace(/\s/g, '')}` });
  }
  if (COMPANY.whatsapp) {
    rows.push({ icon: Icons.support, label: 'WhatsApp', detail: `+${COMPANY.whatsapp}`, url: `https://wa.me/${COMPANY.whatsapp}` });
  }
  if (rows.length === 0) return null;
  return (
    <View>
      {rows.map((row) => (
        <LinkRow key={row.label} icon={row.icon} label={row.label} detail={row.detail} onPress={() => void Linking.openURL(row.url)} />
      ))}
      {!!COMPANY.supportHours && (
        <AppText variant="caption" color="textMuted" style={styles.hours}>
          {COMPANY.supportHours}
        </AppText>
      )}
    </View>
  );
}

export const hasContactDetails = () => !!(COMPANY.supportEmail || COMPANY.supportPhone || COMPANY.whatsapp);

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  body: {
    width: '100%',
    maxWidth: MaxFormWidth + 200,
    alignSelf: 'center',
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
  card: {
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
  },
  sectionTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: 2,
  },
  sectionIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  para: {
    lineHeight: 21,
  },
  bullets: {
    gap: Spacing.two,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two + 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
  },
  stepNo: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 2,
    paddingVertical: Spacing.two + 2,
  },
  hours: {
    marginTop: Spacing.one,
  },
});
