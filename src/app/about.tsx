import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';

import { BrandLogo } from '@/components/brand-logo';
import { Bullets, ContactRows, hasContactDetails, LinkRow, PageBody, Para, Section } from '@/components/content/page-blocks';
import { Icons } from '@/components/ui/icon';
import { ScreenHeader } from '@/components/ui/screen-header';
import { AppText } from '@/components/ui/text';
import { COMPANY } from '@/constants/company';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function AboutScreen() {
  const theme = useTheme();
  const years = new Date().getFullYear() - COMPANY.since;

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScreenHeader title={`About ${COMPANY.name}`} />
      <ScrollView>
        <PageBody>
          <View style={[styles.hero, { backgroundColor: theme.primary }]}>
            <BrandLogo size={120} />
            <AppText variant="title" color="#FFFFFF" style={styles.center}>
              {COMPANY.tagline}
            </AppText>
            <AppText color="rgba(255,255,255,0.85)" style={styles.center}>
              Since {COMPANY.since} · {COMPANY.certification} certified
            </AppText>
          </View>

          <View style={styles.stats}>
            <Stat value={`${years}+`} label="years in kitchens" />
            <Stat value={COMPANY.certification.split(':')[0]} label="certified quality" />
            <Stat value={COMPANY.dispatchTime} label="dispatch time" />
          </View>

          <Section title="Our story" icon={Icons.store}>
            <Para>
              {COMPANY.name} has been designing products for Indian kitchens since {COMPANY.since}. What started as a
              commitment to well-made, long-lasting kitchenware has grown into a range trusted by homes across the
              country.
            </Para>
            <Para>
              With this app you can shop the full range directly from us — with genuine products, secure payments and
              updates on every order.
            </Para>
          </Section>

          <Section title="What we stand for" icon={Icons.verified}>
            <Bullets
              items={[
                `Quality you can rely on — our processes are ${COMPANY.certification} certified.`,
                'Thoughtful design for the way Indian kitchens cook every day.',
                'Honest prices, inclusive of GST, with no surprises at checkout.',
                'Help when you need it, and easy returns on damaged items.',
              ]}
            />
          </Section>

          {(hasContactDetails() || !!COMPANY.address || !!COMPANY.website) && (
            <Section title="Get in touch" icon={Icons.support}>
              {!!COMPANY.address && <Para>{COMPANY.address}</Para>}
              <ContactRows />
              {!!COMPANY.website && (
                <LinkRow icon={Icons.share} label="Visit our website" detail={COMPANY.website} onPress={() => void Linking.openURL(COMPANY.website)} />
              )}
            </Section>
          )}

          <Section title="More" icon={Icons.info}>
            <LinkRow icon={Icons.help} label="Help & FAQs" onPress={() => router.push('/help')} />
            <LinkRow icon={Icons.refresh} label="Returns & refunds" onPress={() => router.push('/returns')} />
            <LinkRow icon={Icons.document} label="Terms & privacy" onPress={() => router.push('/legal')} />
          </Section>

          <AppText variant="caption" color="textMuted" style={styles.center}>
            {COMPANY.name} app v{Constants.expoConfig?.version ?? '1.0.0'}
          </AppText>
        </PageBody>
      </ScrollView>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.stat, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <AppText variant="subheading" color="primary" numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </AppText>
      <AppText variant="caption" color="textMuted" style={styles.center}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    textAlign: 'center',
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
    borderRadius: Radius.xl,
  },
  stats: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: Spacing.three - 2,
    paddingHorizontal: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
