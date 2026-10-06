import { useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { Icon, Icons } from '@/components/ui/icon';
import { AppText } from '@/components/ui/text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { GatewayPayment, GatewayResult } from '@/services/types';

type RazorpayCheckoutProps = {
  /** null hides the sheet. */
  payment: GatewayPayment | null;
  onSuccess: (result: GatewayResult) => void;
  /** User closed checkout, or the payment failed. */
  onDismiss: (reason: 'cancelled' | 'failed') => void;
};

/**
 * Razorpay's standard web checkout, hosted in a WebView. The order is always
 * created server-side first; this only takes the payment against it and hands
 * the signature back for the backend to verify.
 */
export function RazorpayCheckout({ payment, onSuccess, onDismiss }: RazorpayCheckoutProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);

  const html = useMemo(() => (payment ? checkoutHtml(payment, theme.primary) : ''), [payment, theme.primary]);

  function handleMessage(event: WebViewMessageEvent) {
    let message: { type?: string } & Partial<Record<string, string>>;
    try {
      message = JSON.parse(event.nativeEvent.data);
    } catch {
      return;
    }
    if (message.type === 'ready') setLoading(false);
    if (message.type === 'success' && message.razorpay_payment_id && message.razorpay_order_id && message.razorpay_signature) {
      onSuccess({
        paymentId: message.razorpay_payment_id,
        orderId: message.razorpay_order_id,
        signature: message.razorpay_signature,
      });
    }
    if (message.type === 'dismiss') onDismiss('cancelled');
    if (message.type === 'failed') onDismiss('failed');
  }

  return (
    <Modal visible={!!payment} animationType="slide" onRequestClose={() => onDismiss('cancelled')} onShow={() => setLoading(true)}>
      <View style={[styles.root, { backgroundColor: theme.background, paddingTop: insets.top }]}>
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <Icon name={Icons.lock} color={theme.success} size={16} />
          <AppText variant="subheading" style={styles.flex}>
            Secure payment
          </AppText>
          <Pressable accessibilityRole="button" accessibilityLabel="Cancel payment" hitSlop={12} onPress={() => onDismiss('cancelled')}>
            <Icon name={Icons.close} color={theme.text} size={18} weight="bold" />
          </Pressable>
        </View>

        {Platform.OS === 'web' ? (
          <View style={styles.center}>
            <AppText color="textSecondary">Online payment is available in the mobile app.</AppText>
          </View>
        ) : (
          payment && (
            <WebView
              originWhitelist={['*']}
              source={{ html, baseUrl: 'https://checkout.razorpay.com' }}
              onMessage={handleMessage}
              javaScriptEnabled
              domStorageEnabled
              setSupportMultipleWindows={false}
              // UPI apps and other deep links must open outside the WebView
              onShouldStartLoadWithRequest={(req) => {
                if (/^(https?|about|data|blob):/i.test(req.url)) return true;
                Linking.openURL(req.url).catch(() => {});
                return false;
              }}
              style={styles.flex}
            />
          )
        )}

        {loading && Platform.OS !== 'web' && (
          <View style={[styles.loading, { backgroundColor: theme.background }]} pointerEvents="none">
            <ActivityIndicator size="large" color={theme.primary} />
            <AppText color="textSecondary">Opening Razorpay…</AppText>
          </View>
        )}
      </View>
    </Modal>
  );
}

function checkoutHtml(payment: GatewayPayment, color: string) {
  const options = {
    key: payment.key,
    amount: Math.round(payment.amount * 100),
    currency: 'INR',
    name: 'CBS Kitchenware',
    description: payment.description,
    order_id: payment.orderId,
    prefill: payment.prefill,
    theme: { color },
  };

  // JSON.stringify output is safe to inline; `<` is escaped so it can't close the script tag
  const json = JSON.stringify(options).replace(/</g, '\\u003c');

  return `<!doctype html>
<html><head><meta name="viewport" content="width=device-width, initial-scale=1">
<style>html,body{margin:0;height:100%;background:#fff}</style></head>
<body>
<script>
  function post(msg){ window.ReactNativeWebView.postMessage(JSON.stringify(msg)); }
</script>
<script src="https://checkout.razorpay.com/v1/checkout.js" onerror="post({type:'failed'})"></script>
<script>
  var settled = false;
  function settle(msg){ if (settled) return; settled = true; post(msg); }
  var options = ${json};
  options.handler = function (r) { settle({ type: 'success', razorpay_payment_id: r.razorpay_payment_id, razorpay_order_id: r.razorpay_order_id, razorpay_signature: r.razorpay_signature }); };
  options.modal = { ondismiss: function () { settle({ type: 'dismiss' }); } };
  var rzp = new Razorpay(options);
  rzp.on('payment.failed', function () { settle({ type: 'failed' }); });
  rzp.open();
  post({ type: 'ready' });
</script>
</body></html>`;
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three - 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  loading: {
    ...StyleSheet.absoluteFill,
    top: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
});
