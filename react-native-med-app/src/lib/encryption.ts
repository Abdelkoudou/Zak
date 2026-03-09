import * as CryptoJS from 'crypto-js';

// The same secret key used in the Supabase Edge Function
// In a real production app, this should be fetched securely or derived.
const SECRET_PAYLOAD_KEY = process.env.EXPO_PUBLIC_SECRET_PAYLOAD_KEY || "default_dev_key_change_in_prod!";

/**
 * Decrypts a secure JSON payload received from the Edge Function
 */
export function decryptSecurePayload<T>(encryptedResponse: { cipherText: string }): T {
  try {
    if (!encryptedResponse || !encryptedResponse.cipherText) {
      throw new Error("Invalid encrypted payload format");
    }

    // Decrypt the AES cipher text
    const bytes = CryptoJS.AES.decrypt(encryptedResponse.cipherText, SECRET_PAYLOAD_KEY);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decryptedString) {
      throw new Error("Decryption failed. Incorrect key or corrupted payload.");
    }

    // Parse the decrypted JSON string
    const data = JSON.parse(decryptedString) as T;
    return data;
  } catch (error) {
    console.error("[Decryption Error]:", error);
    throw new Error("Failed to decrypt secure content.");
  }
}
