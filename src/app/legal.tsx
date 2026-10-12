import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Bullets, ContactRows, hasContactDetails, LinkRow, PageBody, Para, Section } from '@/components/content/page-blocks';
import { Chip } from '@/components/ui/chip';
import { Icons } from '@/components/ui/icon';
import { ScreenHeader } from '@/components/ui/screen-header';
import { AppText } from '@/components/ui/text';
import { COMPANY, companyLegalName } from '@/constants/company';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/*
 * DRAFT legal text, written to match how this app works (Razorpay payments,
 * Cash on Delivery, push notifications, secure on-device sign-in). Have it
 * reviewed before release; company facts come from constants/company.ts.
 */

type Tab = 'terms' | 'privacy';

export default function LegalScreen() {
  const theme = useTheme();
  // open on a specific part with /legal?tab=privacy
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<Tab>(params.tab === 'privacy' ? 'privacy' : 'terms');

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Terms & privacy" />
      <View style={[styles.tabs, { borderBottomColor: theme.border }]}>
        <Chip label="Terms of use" selected={tab === 'terms'} onPress={() => setTab('terms')} />
        <Chip label="Privacy policy" selected={tab === 'privacy'} onPress={() => setTab('privacy')} />
      </View>
      <ScrollView key={tab}>
        <PageBody>
          <AppText variant="caption" color="textMuted">
            Last updated {COMPANY.policiesUpdated}
          </AppText>
          {tab === 'terms' ? <Terms /> : <Privacy />}
          <Section title="Questions?" icon={Icons.support}>
            {hasContactDetails() ? (
              <ContactRows />
            ) : (
              <Para>Reach our support team from Help & FAQs.</Para>
            )}
            <LinkRow icon={Icons.help} label="Help & FAQs" onPress={() => router.push('/help')} />
          </Section>
        </PageBody>
      </ScrollView>
    </View>
  );
}

function Terms() {
  const name = companyLegalName();
  return (
    <>
      <Section title="1. About these terms">
        <Para>
          These terms apply when you use the {COMPANY.name} app and buy products through it from {name}
          {COMPANY.address ? `, ${COMPANY.address}` : ''}. By creating an account or placing an order, you agree to them.
        </Para>
      </Section>
      <Section title="2. Your account">
        <Bullets
          items={[
            'Give accurate details (name, email, mobile number, delivery address) and keep them up to date.',
            'Keep your password private. You are responsible for activity on your account.',
            'We may suspend accounts that are misused or used for fraud.',
          ]}
        />
      </Section>
      <Section title="3. Products and prices">
        <Bullets
          items={[
            'We describe and photograph products as accurately as we can; small differences in colour or finish can occur.',
            'Prices are in Indian rupees and include GST. A platform fee, if any, is shown in your bill before you pay.',
            'Prices and availability can change without notice. The price that applies is the one shown when you place the order.',
          ]}
        />
      </Section>
      <Section title="4. Orders">
        <Bullets
          items={[
            'An order is confirmed when you receive the order confirmation in the app.',
            'We may cancel an order if a product is unavailable, if there is an obvious pricing error, or if we suspect fraud. Any amount paid is refunded in full.',
            'You can request a cancellation before an order is shipped.',
          ]}
        />
      </Section>
      <Section title="5. Payments">
        <Para>
          Online payments are processed by Razorpay; their terms also apply to the payment. Cash on Delivery is
          offered where available. We do not see or store your card or bank details.
        </Para>
      </Section>
      <Section title="6. Delivery">
        <Para>
          Orders are usually dispatched within {COMPANY.dispatchTime}. Delivery times are estimates and can vary with
          location, courier and events outside our control. Please check the package when it arrives.
        </Para>
      </Section>
      <Section title="7. Returns and refunds">
        <Para>Returns, replacements and refunds follow our Returns & refunds policy.</Para>
        <LinkRow icon={Icons.refresh} label="Read the Returns & refunds policy" onPress={() => router.push('/returns')} />
      </Section>
      <Section title="8. Acceptable use">
        <Para>
          Don’t misuse the app — for example by attempting to access other people’s accounts, interfering with how it
          works, or using it for anything unlawful.
        </Para>
      </Section>
      <Section title="9. Intellectual property">
        <Para>
          The {COMPANY.name} name, logo, product photos and app content belong to {name} and may not be copied or
          used without permission.
        </Para>
      </Section>
      <Section title="10. Liability">
        <Para>
          To the extent permitted by law, our responsibility for any order is limited to the amount you paid for it.
          Nothing in these terms limits your rights as a consumer under Indian law.
        </Para>
      </Section>
      <Section title="11. Changes and governing law">
        <Para>
          We may update these terms; the date at the top shows the latest version. These terms are governed by the
          laws of India.
        </Para>
      </Section>
    </>
  );
}

function Privacy() {
  const name = companyLegalName();
  return (
    <>
      <Section title="What we collect">
        <Bullets
          items={[
            'Account details: your name, email address, mobile number and password (stored securely by our servers).',
            'Delivery addresses you save.',
            'Orders, cart and wishlist, so we can fulfil orders and show your history.',
            'If you allow notifications: a push token that lets us send notifications to this device.',
            'Basic technical information, such as app version and device type, to keep the app working.',
          ]}
        />
      </Section>
      <Section title="How we use it">
        <Bullets
          items={[
            'To create your account, sign you in and keep it secure.',
            'To process, deliver and support your orders, returns and refunds.',
            'To send order updates and, if you allow them, offers and new arrivals.',
            'To improve the app and prevent fraud.',
          ]}
        />
      </Section>
      <Section title="Payments">
        <Para>
          Online payments are handled by Razorpay. Your card, UPI and bank details go directly to them; {name} never
          sees or stores them.
        </Para>
      </Section>
      <Section title="Who we share it with">
        <Para>We never sell your personal data. We share only what’s needed with:</Para>
        <Bullets
          items={[
            'Delivery partners — your name, phone number and address, to deliver your order.',
            'Our payment gateway (Razorpay) — to process payments and refunds.',
            'Service providers that host our systems and deliver notifications, under confidentiality.',
            'Authorities, when required by law.',
          ]}
        />
      </Section>
      <Section title="On your phone">
        <Para>
          The app keeps your sign-in session in your phone’s secure storage so you stay signed in. Signing out removes
          it, and stops notifications to this device.
        </Para>
      </Section>
      <Section title="Your choices">
        <Bullets
          items={[
            'Update your addresses any time in Account → Saved addresses.',
            'Turn notifications on or off in Account → Notifications or in your phone’s settings.',
            'Ask us for a copy of your data, to correct it, or to delete your account by contacting support.',
          ]}
        />
      </Section>
      <Section title="Keeping data safe">
        <Para>
          We use encrypted connections (HTTPS) and keep personal data only as long as needed for orders, legal and
          accounting requirements. We handle personal data in line with applicable Indian law, including the Digital
          Personal Data Protection Act, 2023.
        </Para>
      </Section>
      <Section title="Changes">
        <Para>We may update this policy; the date at the top shows the latest version.</Para>
      </Section>
    </>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  tabs: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
