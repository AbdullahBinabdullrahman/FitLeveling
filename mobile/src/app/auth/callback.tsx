import { useEffect, useRef, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../lib/auth";
import { Screen, Status } from "../../components/ui";
export default function Callback() {
  const { code } = useLocalSearchParams<{ code: string }>(),
    { completeSocial } = useAuth(),
    started = useRef(false),
    [error, setError] = useState<unknown>();
  useEffect(() => {
    if (!code || started.current) return;
    started.current = true;
    completeSocial(code)
      .then(() => router.replace("/login"))
      .catch(setError);
  }, [code, completeSocial]);
  return (
    <Screen title="Signing you in">
      <Status
        loading={!!code && !error}
        error={
          error ?? (!code ? "No authorization code was returned." : undefined)
        }
      />
    </Screen>
  );
}
