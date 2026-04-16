import * as WebBrowser from 'expo-web-browser';
import { Alert, Linking } from 'react-native';

const OPEN_LINK_ERROR_TITLE = 'Unable to open link';
const OPEN_LINK_ERROR_MESSAGE =
  'No browser app is available on this device.';
const INVALID_LINK_ERROR_MESSAGE = 'This link is not available.';

export function isValidExternalUrl(url: string) {
  try {
    const parsedUrl = new URL(url);

    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function openExternalUrl(url: string) {
  if (!isValidExternalUrl(url)) {
    Alert.alert(OPEN_LINK_ERROR_TITLE, INVALID_LINK_ERROR_MESSAGE);
    return false;
  }

  try {
    await WebBrowser.openBrowserAsync(url);
    return true;
  } catch {
    try {
      await Linking.openURL(url);
      return true;
    } catch {
      Alert.alert(OPEN_LINK_ERROR_TITLE, OPEN_LINK_ERROR_MESSAGE);
      return false;
    }
  }
}
