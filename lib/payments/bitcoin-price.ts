// The KES amount a Bitcoin buyer pays, rounded down to whole shillings in their favour.
export function bitcoinPriceKes(priceKes: number, discountPercent: number) {
  const amountKes = Math.max(1, Math.floor((priceKes * (100 - discountPercent)) / 100));
  return { amountKes, savedKes: priceKes - amountKes };
}
