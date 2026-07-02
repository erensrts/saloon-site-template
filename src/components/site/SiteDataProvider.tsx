import { createContext, useContext, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FALLBACK_SITE_DATA,
  siteDataQueryOptions,
  type SiteData,
} from "@/lib/site-data";

const SiteDataContext = createContext<SiteData>(FALLBACK_SITE_DATA);

/**
 * DB'den public içeriği çeker; hata / boşluk halinde `siteConfig` fallback'i
 * devrede kalır. İlk render fallback ile gelir, veri yüklenince güncellenir.
 */
export function SiteDataProvider({ children }: { children: ReactNode }) {
  const { data } = useQuery({
    ...siteDataQueryOptions,
    placeholderData: FALLBACK_SITE_DATA,
  });
  return (
    <SiteDataContext.Provider value={data ?? FALLBACK_SITE_DATA}>
      {children}
    </SiteDataContext.Provider>
  );
}

export const useSiteData = () => useContext(SiteDataContext);
