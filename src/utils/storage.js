import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const isWeb = Platform.OS === 'web';

export const storage = {
    async setItem(key, value) {
        if (isWeb) { localStorage.setItem(key, value); }
        else { await SecureStore.setItemAsync(key, value); }
    },
    async getItem(key) {
        if (isWeb) { return localStorage.getItem(key); }
        return await SecureStore.getItemAsync(key);
    },
    async removeItem(key) {
        if (isWeb) { localStorage.removeItem(key); }
        else { await SecureStore.deleteItemAsync(key); }
    },
};
export default storage;
