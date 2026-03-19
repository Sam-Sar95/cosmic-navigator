import { useRouter } from "expo-router";
import { useEffect } from "react";

export default function NewThemeTab() {
  const router = useRouter();
  useEffect(() => {
    // Redirect immediato alla schermata di inserimento dati
    router.push("/birth-input");
  }, []);
  return null;
}
