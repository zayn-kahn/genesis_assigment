import { toast } from "react-toastify";
import { BaseError, formatUnits } from "viem";

export const truncateAddress = (address: string | `0x${string}`) => {
  return address.slice(0, 6) + "..." + address.slice(-6);
};

export const formatAmount = (amount: bigint, decimals: number) => {
  return amount
    ? Number(formatUnits(amount, decimals)).toFixed(5)
    : (0).toFixed(5);
};

export const logError = (error: BaseError, defaultMessage: string) => {
  console.log(error.cause);
  console.log(error.message);
  console.log(error.shortMessage);
  const message = error.shortMessage.split("the following reason:")[1];
  if (message != undefined) {
    toast.error(message);
  } else if (error.shortMessage.includes("User")) {
    toast.error(error.shortMessage);
  } else {
    if (error.metaMessages) {
      toast.error(error.metaMessages[0]);
    } else {
      toast.error(defaultMessage);
    }
  }
};
