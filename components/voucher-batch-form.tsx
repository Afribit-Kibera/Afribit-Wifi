import { TicketPlus } from "lucide-react";
import { createVoucherBatchAction } from "@/app/admin/(protected)/vouchers/actions";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select } from "./ui/select";

type PackageOption = { id: string; name: string; priceSats: number; durationMinutes: number };

export function VoucherBatchForm({ packages }: { packages: PackageOption[] }) {
  return (
    <form action={createVoucherBatchAction} className="panel p-5 md:p-6">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <div className="md:col-span-2"><label className="field-label" htmlFor="name">Batch name</label><Input id="name" name="name" placeholder="Community event - September" required /></div>
        <div><label className="field-label" htmlFor="packageId">Base package</label><Select id="packageId" name="packageId" defaultValue=""><option value="">Custom voucher</option>{packages.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></div>
        <div><label className="field-label" htmlFor="quantity">Quantity</label><Input id="quantity" name="quantity" type="number" min="1" max="1000" defaultValue="25" required /></div>
        <div><label className="field-label" htmlFor="saleAmountSats">Amount (sats)</label><Input id="saleAmountSats" name="saleAmountSats" type="number" min="0" defaultValue="1000" required /></div>
        <div><label className="field-label" htmlFor="accessDurationMinutes">Access time (minutes)</label><Input id="accessDurationMinutes" name="accessDurationMinutes" type="number" min="5" defaultValue="180" required /></div>
        <div><label className="field-label" htmlFor="dataLimitMb">Data cap (MB)</label><Input id="dataLimitMb" name="dataLimitMb" type="number" min="1" placeholder="Unlimited" /></div>
        <div><label className="field-label" htmlFor="speedLimitKbps">Speed cap (Kbps)</label><Input id="speedLimitKbps" name="speedLimitKbps" type="number" min="1" placeholder="Package default" /></div>
        <div><label className="field-label" htmlFor="validFrom">Valid from</label><Input id="validFrom" name="validFrom" type="datetime-local" /></div>
        <div><label className="field-label" htmlFor="validUntil">Valid until</label><Input id="validUntil" name="validUntil" type="datetime-local" /></div>
        <div><label className="field-label" htmlFor="maxRedemptions">Uses per voucher</label><Input id="maxRedemptions" name="maxRedemptions" type="number" min="1" max="100" defaultValue="1" required /></div>
        <div><label className="field-label" htmlFor="prefix">Code prefix</label><Input id="prefix" name="prefix" maxLength={6} defaultValue="BV" required /></div>
      </div>
      <div className="mt-6 flex justify-end"><Button type="submit"><TicketPlus size={17} /> Create batch</Button></div>
    </form>
  );
}

