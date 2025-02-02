import * as React from "react";
import classNames from "clsx";
import Carousel from "@brainhubeu/react-carousel";
import { Link } from "lib/woozie";
import {
  ThanosAsset,
  ThanosToken,
  useAssets,
  useTokens,
  useCurrentAsset,
} from "lib/thanos/front";
import { getAssetIconUrl } from "app/defaults";
import Balance from "app/templates/Balance";
import InUSD from "app/templates/InUSD";
import Name from "app/atoms/Name";
import Money from "app/atoms/Money";
import { ReactComponent as EllypsisIcon } from "app/icons/ellypsis.svg";
import { ReactComponent as AddIcon } from "app/icons/add.svg";
import { ReactComponent as RemoveIcon } from "app/icons/remove.svg";
import styles from "./Assets.module.css";
import Popper from "lib/ui/Popper";
import DropdownWrapper from "app/atoms/DropdownWrapper";

type AssetsProps = {
  accountPkh: string;
  className?: string;
};

const Assets: React.FC<AssetsProps> = ({ accountPkh, className }) => {
  const { allAssets, defaultAsset } = useAssets();
  const { currentAsset, setAssetSymbol } = useCurrentAsset();

  const currentAssetIndex = React.useMemo(() => {
    const i = allAssets.findIndex((a) => currentAsset.symbol === a.symbol);
    return i === -1 ? 0 : i;
  }, [allAssets, currentAsset]);

  const [localAssetIndex, setLocalAssetIndex] = React.useState(
    currentAssetIndex
  );
  const localAssetIndexRef = React.useRef(localAssetIndex);

  const toRealAssetIndex = React.useCallback(
    (i: number) => {
      const index = i % allAssets.length;
      return index >= 0 ? index : allAssets.length + index;
    },
    [allAssets.length]
  );

  React.useEffect(() => {
    if (currentAssetIndex !== toRealAssetIndex(localAssetIndex)) {
      setLocalAssetIndex(
        currentAssetIndex === toRealAssetIndex(localAssetIndexRef.current)
          ? localAssetIndexRef.current
          : currentAssetIndex
      );
    }
  }, [
    currentAssetIndex,
    localAssetIndex,
    toRealAssetIndex,
    setLocalAssetIndex,
  ]);

  const handleCarouselChange = React.useCallback(
    (i: number) => {
      const symbol =
        allAssets[toRealAssetIndex(i)]?.symbol ?? defaultAsset.symbol;

      localAssetIndexRef.current = i;
      setAssetSymbol(symbol);
    },
    [toRealAssetIndex, allAssets, defaultAsset, setAssetSymbol]
  );

  const slides = React.useMemo(
    () =>
      allAssets.map((asset, i) => (
        <div className="p-2 flex flex-col items-center justify-around">
          <img
            src={getAssetIconUrl(asset)}
            alt={asset.name}
            className={classNames(i === 0 ? "w-16 h-16" : "w-12 h-12")}
            style={{ minHeight: i === 0 ? "4rem" : "3rem" }}
          />

          {i !== 0 && (
            <Name
              className={classNames(
                "mt-1 w-16",
                "text-center",
                "text-xs text-gray-600 font-medium leading-tight"
              )}
            >
              {asset.name}
            </Name>
          )}
        </div>
      )),
    [allAssets]
  );

  const carousel = React.useMemo(
    () =>
      slides.length > 1 ? (
        <div className={classNames("w-64 mb-2", styles["carousel-container"])}>
          <Carousel
            value={localAssetIndex}
            slides={slides}
            onChange={handleCarouselChange}
            slidesPerPage={2}
            centered
            arrows
            infinite
            clickToChange
            draggable={false}
          />
        </div>
      ) : (
        <div className="mb-2 -mr-px px-2">{slides[0]}</div>
      ),
    [slides, localAssetIndex, handleCarouselChange]
  );

  return (
    <div className={classNames("w-full flex flex-col items-center", className)}>
      <div className={classNames("flex flex-col items-stretch")}>
        <div
          className={classNames("mb-2", "flex items-center")}
          style={{ minWidth: "9rem" }}
        >
          <div className="flex-1" />

          <ControlButton asset={currentAsset} />
        </div>

        {carousel}
      </div>

      <Balance address={accountPkh} asset={currentAsset}>
        {(balance) => (
          <div className="flex flex-col items-center">
            <div className="text-gray-800 text-2xl font-light">
              <Money>{balance}</Money>{" "}
              <span className="text-lg opacity-90">{currentAsset.symbol}</span>
            </div>

            <InUSD volume={balance} asset={currentAsset}>
              {(usdBalance) => (
                <div className="text-gray-600 text-lg font-light">
                  <span className="mr-px">$</span>
                  {usdBalance} <span className="text-sm opacity-75">USD</span>
                </div>
              )}
            </InUSD>
          </div>
        )}
      </Balance>
    </div>
  );
};

export default Assets;

type ControlButton = React.HTMLAttributes<HTMLButtonElement> & {
  asset: ThanosAsset;
};

const ControlButton = React.memo<ControlButton>(
  ({ asset, className, ...rest }) => {
    const { removeToken } = useTokens();

    return (
      <Popper
        placement="bottom-end"
        strategy="fixed"
        popup={({ opened, setOpened }) => (
          <>
            <DropdownWrapper
              opened={opened}
              className="origin-top-right"
              style={{
                backgroundColor: "white",
                borderColor: "#edf2f7",
              }}
            >
              <div className="flex flex-col items-start">
                <Link
                  to="/add-token"
                  className={classNames(
                    "block w-full",
                    "mb-1 px-2 py-1",
                    "text-sm font-medium text-gray-600",
                    "rounded",
                    "transition easy-in-out duration-200",
                    "hover:bg-gray-100",
                    "flex items-center"
                  )}
                >
                  <AddIcon
                    className={classNames(
                      "mr-2 flex-shrink-0",
                      "h-4 w-auto stroke-current stroke-2",
                      "opacity-75"
                    )}
                  />
                  Add new Token
                </Link>

                <button
                  className={classNames(
                    "block items-centerw-full",
                    "mb-1 px-2 py-1",
                    "text-left",
                    "text-sm font-medium text-gray-600",
                    "rounded",
                    "transition easy-in-out duration-200",
                    "flex items-center",
                    !asset.default && "hover:bg-gray-100",
                    asset.default ? "cursor-default" : "cursor-pointer",
                    asset.default && "opacity-50"
                  )}
                  disabled={asset.default}
                  onClick={() => {
                    if (asset.default) return;

                    removeToken(asset as ThanosToken);
                    setOpened(false);
                  }}
                >
                  <RemoveIcon
                    className={classNames(
                      "mr-2 flex-shrink-0",
                      "h-4 w-auto stroke-current stroke-2",
                      "opacity-75"
                    )}
                  />
                  Hide "{asset.name}" token
                </button>
              </div>
            </DropdownWrapper>

            <div className={styles["control-arrow"]} data-popper-arrow />
          </>
        )}
      >
        {({ ref, toggleOpened }) => (
          <button
            ref={ref}
            className={classNames(
              "p-1",
              "rounded-full shadow-xs",
              "bg-gray-100",
              "flex items-center",
              "text-gray-500 text-sm",
              "transition ease-in-out duration-200",
              "hover:bg-black-5",
              "opacity-75 hover:opacity-100 focus:opacity-100",
              className
            )}
            {...rest}
            onClick={toggleOpened}
          >
            <EllypsisIcon
              className={classNames(
                "flex-shrink-0",
                "h-5 w-auto stroke-current stroke-2"
              )}
            />
          </button>
        )}
      </Popper>
    );
  }
);
