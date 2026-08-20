import { useEffect, useState } from "react";
import { customFetch } from "@/api-generated/custom-fetch";

interface AuthConfig {
  googleEnabled: boolean;
}

export function useAuthConfig() {
  const [config, setConfig] = useState<AuthConfig | null>(null);

  useEffect(() => {
    let active = true;
    customFetch<AuthConfig>("/api/auth/config")
      .then((data) => {
        if (active) setConfig(data ?? { googleEnabled: false });
      })
      .catch(() => {
        if (active) setConfig({ googleEnabled: false });
      });
    return () => {
      active = false;
    };
  }, []);

  return { googleEnabled: config?.googleEnabled ?? false };
}
