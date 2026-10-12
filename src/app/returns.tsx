import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Bullets, ContactRows, hasContactDetails, LinkRow, PageBody, Para, Section, Steps } from '@/components/content/page-blocks';
import { Icons } from '@/components/ui/icon';
import { ScreenHeader } from '@/components/ui/screen-header';
import { COMPANY } from '@/constants/company';
import { useTheme } from '@/hooks/use-theme';

export default function ReturnsScreen() {
  const theme = useTheme();
  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Returns & refunds" />
      <ScrollView>
        <PageBody>
          <Section title="Our promise" icon={Icons.shield}>
            <Para>
              Every {COMPANY.name} product is checked before it leaves us. If something arrives damaged, defective or
              isn’t what you ordered, we’ll make it right with a replacement or a full refund.
            </Para>
          </Section>

          <Section title="What can be returned" icon={Icons.checkCircle}>
            <Bullets
              items={[
                'Products that arrive damaged or broken in transit.',
                'Products with a manufacturing defect.',
                'A wrong product, size, colour or variant compared with your order.',
                'Missing items or parts.',
              ]}
            />
          </Section>

          <Section title="What can’t be returned" icon={Icons.alert}>
            <Bullets
              items={[
                'Products that have been used, washed or installed, unless they are defective.',
                'Damage caused by misuse, accidents or not following the care instructions.',
                'Normal wear and tear, or minor variations in colour and finish.',
                `Issues reported after ${COMPANY.returnReportWindow} of delivery (except manufacturing defects covered by warranty).`,
              ]}
            />
          </Section>

          <Section title="How to request a return" icon={Icons.box}>
            <Steps
              items={[
                `Contact us within ${COMPANY.returnReportWindow} of delivery with your order number.`,
                'Share clear photos (or a short video) of the product, the problem and the outer packaging.',
                'Keep the product with its original box, tags and accessories.',
                'Our team checks the request and arranges a pickup or a replacement.',
              ]}
            />
          </Section>

          <Section title="Refunds" icon={Icons.wallet}>
            <Bullets
              items={[
                `Once a return is approved, the refund is processed within ${COMPANY.refundTime}.`,
                'Online payments (UPI, card, net banking) are refunded to the same payment method.',
                'Cash on Delivery orders are refunded to your bank account or UPI ID.',
                'If a payment was deducted but the order wasn’t placed, the amount is refunded automatically.',
              ]}
            />
          </Section>

          <Section title="Cancellations" icon={Icons.close}>
            <Para>
              You can ask us to cancel an order until it has been shipped. If you paid online, the full amount is
              refunded to your original payment method. Once shipped, an order can’t be cancelled, but eligible
              products can be returned as described above.
            </Para>
          </Section>

          <Section title="Need help with a return?" icon={Icons.support}>
            {hasContactDetails() && <ContactRows />}
            <LinkRow icon={Icons.help} label="Help & FAQs" detail="Answers to common questions" onPress={() => router.push('/help')} />
            <LinkRow icon={Icons.orders} label="My orders" detail="Find your order number" onPress={() => router.navigate('/orders')} />
          </Section>
        </PageBody>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
