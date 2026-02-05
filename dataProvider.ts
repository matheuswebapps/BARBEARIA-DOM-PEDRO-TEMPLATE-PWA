
import { PROVIDER_MODE } from "./config";
import { DataProviderInterface } from "./providers/interfaces";
import { localStorageProvider } from "./providers/localStorageProvider";
import { supabaseProvider } from "./providers/supabaseProvider";
import { isSupabaseConfigured } from "./services/supabaseClient";

// Factory to select the active provider
const getProvider = (): DataProviderInterface => {
  if (PROVIDER_MODE === 'supabase') {
    if (!isSupabaseConfigured) {
      console.warn('[dataProvider] PROVIDER_MODE=supabase, but env vars are missing. Falling back to local provider.');
      return localStorageProvider;
    }
    return supabaseProvider;
  }
  return localStorageProvider;
};

// Export the singleton instance
export const dataProvider = getProvider();
