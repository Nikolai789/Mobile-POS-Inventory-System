import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getProductByBarcode } from '../../../shared/api/products';
import useLatestRequest from '../../../shared/hooks/useLatestRequest';

/** Consumers decide whether a scanned product opens a form or enters the cart. */
export default function useBarcodeLookup() {
  const [busy, setBusy] = useState(false);
  const requests = useLatestRequest();
  const cancel = useCallback(() => { requests.cancel(); setBusy(false); }, [requests]);
  useFocusEffect(useCallback(() => cancel, [cancel]));
  const lookup = useCallback(async (barcode: string) => {
    const ticket = requests.start();
    setBusy(true);
    try {
      const product = await getProductByBarcode(barcode, ticket.signal);
      return requests.isCurrent(ticket) ? product : null;
    } catch (error) {
      if (requests.isCurrent(ticket)) throw error;
      return null;
    } finally {
      if (requests.isCurrent(ticket)) setBusy(false);
    }
  }, [requests]);
  return { busy, lookup, cancel };
}
