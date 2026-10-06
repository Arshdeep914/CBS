import { ApiError, post, requestEnvelope } from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
import { MESSAGE_CODE, type ApiLogin, type ApiOtpToken } from '@/api/types';
import { postingDate } from '@/api/timestamp';
import type { ShopService } from '@/services/types';

export const liveAuth: ShopService['auth'] = {
  async signIn(email, password) {
    const data = await post<ApiLogin>(ENDPOINTS.CUSTOMER.LOGIN, { username: email, password });
    if (!data?.token || !data.userModel?.code) {
      throw new ApiError('The server sent back an unexpected sign-in response.');
    }
    return {
      jwt: data.token,
      pksoftToken: data.pksoft_token ?? '',
      user: {
        code: data.userModel.code,
        name: data.userModel.name ?? '',
        email: data.userModel.userName ?? email,
      },
    };
  },

  /** v2 sign-up, as on the Sardar Times storefront. */
  async register({ name, email, mobile, password, confirmPassword }) {
    const envelope = await requestEnvelope<ApiOtpToken>({
      method: 'post',
      url: ENDPOINTS.CUSTOMER.REGISTER,
      data: { name, emailId: email, mobile, postingDate: postingDate(), password, confirmPassword },
    });
    // 100 = new account, 108 = the email is already pending; both send a code
    if (envelope.messageCode !== MESSAGE_CODE.SUCCESS && envelope.messageCode !== MESSAGE_CODE.ALREADY_EXISTS) {
      throw new ApiError(envelope.message || 'Registration failed. Please try again.', envelope.messageCode, envelope.status);
    }
    return { token: envelope.data?.token ?? '', message: envelope.message };
  },

  async verifyRegistration(email, otp, token) {
    const envelope = await requestEnvelope<unknown>({
      method: 'post',
      url: ENDPOINTS.CUSTOMER.VERIFY_OTP,
      data: { emailId: email, token, otpCode: otp, postingDate: postingDate() },
    });
    if (envelope.messageCode !== MESSAGE_CODE.SUCCESS) {
      throw new ApiError(envelope.message || "That code didn't work. Please try again.", envelope.messageCode);
    }
  },

  async requestPasswordReset(email, newPassword) {
    const envelope = await requestEnvelope<ApiOtpToken>({
      method: 'post',
      url: ENDPOINTS.CUSTOMER.FORGET_PASSWORD,
      data: { username: email, newPassword },
    });
    if (envelope.messageCode === MESSAGE_CODE.SUCCESS) {
      return { otpSent: true, token: envelope.data?.token ?? '', message: envelope.message };
    }
    // 108 = the existing password was emailed; nothing more to do
    if (envelope.messageCode === MESSAGE_CODE.ALREADY_EXISTS) {
      return { otpSent: false, token: '', message: envelope.message };
    }
    throw new ApiError(envelope.message || "Couldn't start the password reset.", envelope.messageCode);
  },

  async confirmPasswordReset(email, otp, newPassword, token) {
    await post<unknown>(ENDPOINTS.CUSTOMER.FORGET_PASSWORD_OTP, {
      username: email,
      otpCode: otp,
      newPassword,
      token,
    });
  },
};
