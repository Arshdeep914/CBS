import { post, requestEnvelope } from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import type { ApiAddress } from '@/api/types';
import { encodedTimestamp } from '@/api/timestamp';
import { currentUid } from '@/lib/session-storage';
import type { Address, AddressInput, ShopService } from '@/services/types';

function toAddress(raw: ApiAddress): Address {
  return {
    id: String(raw.id ?? raw.code ?? ''),
    fullName: raw.fullName ?? '',
    mobile: raw.mobileNo ?? '',
    email: raw.email ?? '',
    line1: raw.addressLine1 ?? '',
    line2: raw.addressLine2 ?? '',
    landmark: raw.landMark ?? '',
    city: raw.cityName ?? '',
    state: raw.stateName ?? '',
    pinCode: raw.pinCode ?? '',
    isPrimary: Boolean(raw.isPrimary),
  };
}

function toApi(input: AddressInput) {
  return {
    fullName: input.fullName,
    mobileNo: input.mobile,
    email: input.email,
    addressLine1: input.line1,
    addressLine2: input.line2,
    landMark: input.landmark,
    cityName: input.city,
    stateName: input.state,
    countryName: 'India',
    pinCode: input.pinCode,
  };
}

export const liveAddresses: ShopService['addresses'] = {
  async list() {
    const envelope = await requestEnvelope<ApiAddress[]>({
      method: 'post',
      url: `${ENDPOINTS.ADDRESS.LIST}/${currentUid()}`,
      data: { date: encodedTimestamp() },
    });
    return Array.isArray(envelope.data) ? envelope.data.map(toAddress).filter((a) => a.id) : [];
  },

  async create(input) {
    await post<unknown>(ENDPOINTS.ADDRESS.CREATE, {
      ...toApi(input),
      userCode: currentUid(),
      d: encodedTimestamp(),
      date: encodedTimestamp(),
    });
  },

  async update(id, input) {
    await post<unknown>(`${ENDPOINTS.ADDRESS.UPDATE}/${id}`, {
      ...toApi(input),
      code: id,
      userCode: currentUid(),
      d: encodedTimestamp(),
      date: encodedTimestamp(),
    });
  },

  async remove(id) {
    await post<unknown>(`${ENDPOINTS.ADDRESS.DELETE}/${id}`, { userid: currentUid(), d: encodedTimestamp() });
  },

  async setPrimary(id) {
    await post<unknown>(`${ENDPOINTS.ADDRESS.SET_PRIMARY}/${id}`, { userCode: currentUid(), d: encodedTimestamp() });
  },
};
