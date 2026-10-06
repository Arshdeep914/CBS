import { post } from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { encodedTimestamp } from '@/api/timestamp';
import { currentUid } from '@/lib/session-storage';
import type { ShopService } from '@/services/types';

/**
 * Push-token endpoints, as specified for the backend team in
 * docs/push-notifications-backend-guide.pdf (§4). Same conventions as the
 * other customer calls: `uid`, the `d` timestamp, JWT / X-AUTH / CSRF headers.
 */
export const livePush: ShopService['push'] = {
  async register({ token, platform, deviceName, appVersion }) {
    await post<unknown>(ENDPOINTS.CUSTOMER.PUSH_TOKEN_REGISTER, {
      uid: currentUid(),
      token,
      platform,
      deviceName,
      appVersion,
      d: encodedTimestamp(),
    });
  },

  async remove(token) {
    await post<unknown>(ENDPOINTS.CUSTOMER.PUSH_TOKEN_REMOVE, {
      uid: currentUid(),
      token,
      d: encodedTimestamp(),
    });
  },
};
