import { useEffect, useState } from 'react';
import { bus, Listing, store } from '@/lib/api';

export function useProgressStream(listingId: number) {
  const [listing, setListing] = useState<Listing | null>(() => {
    return store.listings.find(l => l.id === listingId) || null;
  });

  useEffect(() => {
    const unsub = bus.on('progress:' + listingId, (updated: Listing) => {
      setListing({ ...updated });
    });
    return unsub;
  }, [listingId]);

  return listing;
}
