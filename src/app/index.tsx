import { Redirect } from "expo-router";
import { useCurrentUser } from "@store/userStore";

export default function Index() {
  const user = useCurrentUser();

  if (!user) return <Redirect href="/(onboarding)/" />;
  return <Redirect href="/(tabs)/home" />;
}
