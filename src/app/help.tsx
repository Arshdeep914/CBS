import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { ContactRows, hasContactDetails, LinkRow, PageBody, Section } from '@/components/content/page-blocks';
import { Icon, Icons, type IconName } from '@/components/ui/icon';
import { ScreenHeader } from '@/components/ui/screen-header';
import { AppText } from '@/components/ui/text';
import { Env } from '@/config/env';
import { COMPANY } from '@/constants/company';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatINR } from '@/lib/format';

type Faq = { q: string; a: string };

const TOPICS: { title: string; icon: IconName; faqs: Faq[] }[] = [
  {
    title: 'Orders & delivery',
    icon: Icons.box,
    faqs: [
      {
        q: 'How do I place an order?',
        a: 'Add products to your cart, open the cart, choose a delivery address and a payment method, then tap Place order. You’ll see a confirmation screen and the order appears under Orders.',
      },
      {
        q: 'When will my order be dispatched?',
        a: `Orders are usually dispatched within ${COMPANY.dispatchTime}. Delivery time after that depends on your location and the courier.`,
      },
      {
        q: 'How do I track my order?',
        a: 'Open the Orders tab and tap an order to see its status and progress. If notifications are on, we’ll also tell you when it’s confirmed, shipped and delivered.',
      },
      {
        q: 'Can I cancel an order?',
        a: 'You can ask us to cancel an order until it has been shipped. Contact our support team with your order number as soon as possible.',
      },
      {
        q: 'Can I change the delivery address after ordering?',
        a: 'Contact us before the order is shipped and we’ll do our best to update it. For future orders, manage your addresses in Account → Saved addresses.',
      },
    ],
  },
  {
    title: 'Payments',
    icon: Icons.wallet,
    faqs: [
      {
        q: 'Which payment methods can I use?',
        a: 'UPI, debit and credit cards and net banking (processed securely by Razorpay), and Cash on Delivery where it’s available for your order.',
      },
      {
        q: 'Is it safe to pay online?',
        a: 'Yes. Online payments are handled by Razorpay, a PCI-DSS compliant payment gateway. We never see or store your card or bank details.',
      },
      {
        q: 'Money was deducted but my order failed. What now?',
        a: `If a payment goes through but the order isn’t confirmed, the amount is refunded automatically to the original payment method, usually within ${COMPANY.refundTime}. If you don’t see it by then, contact us with the payment details.`,
      },
      {
        q: 'What is the platform fee?',
        a:
          Env.platformFee > 0
            ? `A flat fee of ${formatINR(Env.platformFee)} per order that helps us run the platform. It’s shown separately in your bill before you pay.`
            : 'Any platform fee is shown separately in your bill before you pay.',
      },
      {
        q: 'Are prices inclusive of GST?',
        a: 'Yes, product prices include GST. The final amount is confirmed when you place the order.',
      },
    ],
  },
  {
    title: 'Returns & refunds',
    icon: Icons.refresh,
    faqs: [
      {
        q: 'I received a damaged, defective or wrong item.',
        a: `We’re sorry! Please report it within ${COMPANY.returnReportWindow} of delivery with photos of the product and packaging, and we’ll arrange a replacement or refund. See Returns & refunds for the full policy.`,
      },
      {
        q: 'How long do refunds take?',
        a: `Once a return is approved, refunds reach your original payment method within ${COMPANY.refundTime}. Cash on Delivery refunds are sent to your bank account or UPI ID.`,
      },
    ],
  },
  {
    title: 'Your account',
    icon: Icons.account,
    faqs: [
      {
        q: 'I forgot my password.',
        a: 'On the sign-in screen tap Forgot password?, enter your email and a new password, then enter the 6-digit code we email you.',
      },
      {
        q: 'How do I manage notifications?',
        a: 'Go to Account → Notifications to turn them on. On Android you can also choose which kinds you get (order updates, offers) in your phone’s notification settings.',
      },
      {
        q: 'How do I save or change an address?',
        a: 'Go to Account → Saved addresses to add, edit, remove or choose your default address.',
      },
    ],
  },
];

export default function HelpScreen() {
  const theme = useTheme();
  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Help & FAQs" />
      <ScrollView>
        <PageBody>
          {TOPICS.map((topic) => (
            <Section key={topic.title} title={topic.title} icon={topic.icon}>
              <View>
                {topic.faqs.map((faq, index) => (
                  <FaqItem key={faq.q} faq={faq} first={index === 0} />
                ))}
              </View>
            </Section>
          ))}

          <Section title="Still need help?" icon={Icons.support}>
            {hasContactDetails() && <ContactRows />}
            <LinkRow icon={Icons.refresh} label="Returns & refunds" detail="Our return and refund policy" onPress={() => router.push('/returns')} />
            <LinkRow icon={Icons.document} label="Terms & privacy" detail="Terms of use and privacy policy" onPress={() => router.push('/legal')} />
          </Section>
        </PageBody>
      </ScrollView>
    </View>
  );
}

function FaqItem({ faq, first }: { faq: Faq; first: boolean }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <View style={!first && { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((o) => !o)}
        style={({ pressed }) => [styles.question, pressed && { opacity: 0.6 }]}>
        <AppText variant="bodyStrong" style={styles.flex}>
          {faq.q}
        </AppText>
        <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
          <Icon name={Icons.chevronDown} color={theme.textMuted} size={14} weight="bold" />
        </View>
      </Pressable>
      {open && (
        <Animated.View entering={FadeIn.duration(180)} style={[styles.answer, { backgroundColor: theme.surfaceMuted }]}>
          <AppText color="textSecondary" style={styles.answerText}>
            {faq.a}
          </AppText>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  question: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three - 4,
    paddingVertical: Spacing.three - 2,
  },
  answer: {
    padding: Spacing.three - 4,
    borderRadius: Radius.md,
    marginBottom: Spacing.three - 2,
  },
  answerText: {
    lineHeight: 21,
  },
});
