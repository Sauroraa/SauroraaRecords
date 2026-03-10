import { Redirect } from "expo-router";
import { useAppState } from "@/providers/app-provider";

export default function IndexRedirect() {
  const { hydrated, onboardingComplete, session } = useAppState();

  if (!hydrated) return null;
  if (!onboardingComplete) return <Redirect href={"/welcome" as never} />;
  if (!session.user) return <Redirect href={"/auth" as never} />;
  return <Redirect href="/home" />;
}
