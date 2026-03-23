import { Share } from "react-native";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import { captureRef } from "react-native-view-shot";
import type { SavedTheme } from "./astral-store";

/**
 * Esporta il tema natale come immagine e lo condivide
 */
export async function shareThemeAsImage(
  viewRef: any,
  theme: SavedTheme
): Promise<void> {
  try {
    // Cattura la vista come immagine
    const uri = await captureRef(viewRef, {
      format: "png",
      quality: 0.95,
    });

    // Crea un nome file descrittivo
    const fileName = `${theme.name.replace(/\s+/g, "_")}_${new Date().getTime()}.png`;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;

    // Copia l'immagine nella directory documenti
    await FileSystem.copyAsync({
      from: uri,
      to: filePath,
    });

    // Condividi l'immagine
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filePath, {
        mimeType: "image/png",
        dialogTitle: `Condividi il tema di ${theme.name}`,
        UTI: "com.apple.png",
      });
    } else {
      // Fallback a Share se Sharing non è disponibile
      await Share.share({
        url: filePath,
        title: `Tema di ${theme.name}`,
      });
    }
  } catch (error) {
    console.error("Errore durante l'esportazione del tema:", error);
    throw error;
  }
}

/**
 * Esporta il tema come testo (fallback se la cattura dell'immagine fallisce)
 */
export async function shareThemeAsText(theme: SavedTheme): Promise<void> {
  try {
    const text = `
🌟 Tema Natale: ${theme.name}
📅 Data di nascita: ${theme.birthData.day}/${theme.birthData.month}/${theme.birthData.year}
⏰ Ora: ${theme.birthData.hour}:${String(theme.birthData.minute).padStart(2, "0")}
📍 Luogo: ${theme.birthData.placeName}

☉ Sole: ${theme.astrologicalData.sun.sign}
☽ Luna: ${theme.astrologicalData.moon.sign}
↑ Ascendente: ${theme.astrologicalData.ascendant.sign}

Generato con Cosmic Navigator ✨
    `.trim();

    await Share.share({
      message: text,
      title: `Tema di ${theme.name}`,
    });
  } catch (error) {
    console.error("Errore durante la condivisione del testo:", error);
    throw error;
  }
}
