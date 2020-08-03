import * as React from "react";
import {
  XTZ_ASSET,
  MAINNET_TOKENS,
  useNetwork,
  useTokens,
  useStorage,
  ThanosAsset,
} from "lib/thanos/front";
import { useAccount } from "./ready";

export function useAssets() {
  const network = useNetwork();
  const { tokens } = useTokens();
  
  /**
   * All assets reference(cache), needed for pretty network reselect
   */
  const allAssetsRef = React.useRef<ThanosAsset[]>([]);

  const allAssets = React.useMemo(
    () => [
      XTZ_ASSET,
      ...(network.type === "main" ? MAINNET_TOKENS : []),
      ...tokens,
    ],
    [network.type, tokens]
  );

  React.useEffect(() => {
    allAssetsRef.current = allAssets;
  }, [allAssetsRef, allAssets]);

  const defaultAsset = React.useMemo(() => allAssets[0], [allAssets]);

  return { allAssets, defaultAsset, allAssetsRef };
}

export function useCurrentAsset() {
  const { allAssets, defaultAsset } = useAssets();

  const network = useNetwork();
  const account = useAccount();
  const [assetSymbol, setAssetSymbol] = useStorage(
    `assetsymbol_${network.id}_${account.publicKeyHash}`,
    defaultAsset.symbol
  );

  const currentAsset = React.useMemo(
    () => allAssets.find((a) => a.symbol === assetSymbol) ?? defaultAsset,
    [allAssets, assetSymbol, defaultAsset]
  );

  return {
    assetSymbol,
    setAssetSymbol,
    currentAsset,
  };
}
