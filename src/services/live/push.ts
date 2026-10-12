import { ApiError, requestEnvelope } from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import type { ApiDevice, ApiEnvelope } from '@/api/types';
import type { ShopService } from '@/services/types';

/**
 * Device registration for push notifications (backend `api/Mobile/*`).
 *
 * Both calls need the signed-in customer's JWT — the API client adds it — so
 * they only run after sign-in. The backend's contract: call ValidateDevice
 * first, then RegisterDevice, with `deviceId` set to the push token.
 */

/**
 * These endpoints' sample response is `{ status: 100, messageCode: 0 }` — the
 * reverse of the rest of the API (`status: 200, messageCode: 100`). Accept 100
 * in either field until the real responses are confirmed in the logs.
 */
function succeeded(envelope: ApiEnvelope<unknown> | null | undefined) {
  return !!envelope && (envelope.messageCode === 100 || envelope.status === 100);
}

async function call(url: string, body: ApiDevice, what: string) {
  const envelope = await requestEnvelope<unknown>({ method: 'post', url, data: body });
  if (!succeeded(envelope)) {
    throw new ApiError(envelope?.message || `${what} failed.`, envelope?.messageCode ?? 0, envelope?.status ?? 0);
  }
  return envelope;
}

export const livePush: ShopService['push'] = {
  async register({ pushToken, platform, deviceName, osVersion, appVersion }) {
    const device: ApiDevice = { deviceId: pushToken, deviceName, platform, osVersion, appVersion, pushToken };
    await call(ENDPOINTS.MOBILE.VALIDATE_DEVICE, device, 'Device validation');
    await call(ENDPOINTS.MOBILE.REGISTER_DEVICE, device, 'Device registration');
  },

  // The backend has no "remove device" endpoint yet; until it does, sign-out
  // can't unlink this phone server-side.
  async remove() {
    console.log('[push] no RemoveDevice endpoint yet — this phone stays registered after sign-out');
  },
};
