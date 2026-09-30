import * as Device from 'expo-device';
import { Platform } from 'react-native';

export type DeviceInfo = {
  /** User-facing name, e.g. "Rahul's iPhone". */
  name: string;
  /** Manufacturer and model, e.g. "Apple iPhone 15". */
  model: string;
  /** e.g. "iOS 18.2" or "Android 15". */
  os: string;
  /** False on simulators and emulators. */
  isPhysicalDevice: boolean;
};

/** Details sent with each sign-in request so the admin can see which device is asking. */
export function getDeviceInfo(): DeviceInfo {
  const model =
    [Device.manufacturer, Device.modelName].filter(Boolean).join(' ') || 'Unknown device';

  return {
    name: Device.deviceName ?? model,
    model,
    os: [Device.osName ?? Platform.OS, Device.osVersion].filter(Boolean).join(' '),
    isPhysicalDevice: Device.isDevice,
  };
}
