import { useSession } from "@/hooks/auth";
import { SplashScreen } from "expo-router";

export default function SplashScreenController() {
  const { isLoading } = useSession();

  if (!isLoading) {
    SplashScreen.hideAsync();
  }

  return null;
}
