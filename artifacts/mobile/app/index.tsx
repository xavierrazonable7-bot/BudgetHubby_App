import { Redirect } from "expo-router";
import { useApp } from "@/context/AppContext";

export default function IndexRedirect() {
  const { isOnboarded } = useApp();
  if (!isOnboarded) {
    return <Redirect href="/onboarding" />;
  }
  return <Redirect href="/(tabs)" />;
}
