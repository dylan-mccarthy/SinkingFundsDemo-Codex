<script lang="ts">
  import type { PageData } from './$types';
  export let data: PageData;

  const toDollars = (cents: number) => (cents / 100).toFixed(2);
</script>

<h1 class="mb-4 text-2xl font-bold">Settings</h1>

<form method="post" action="?/update" class="space-y-4 max-w-sm">
  <label class="block">
    <span class="text-sm font-medium">Monthly Deposit ($)</span>
    <input
      class="input mt-1 w-full"
      type="number"
      step="0.01"
      name="monthlyDeposit"
      value={toDollars(data.settings.monthlyDepositCents)}
      required
    />
  </label>
  <label class="flex items-center space-x-2">
    <input type="checkbox" name="overspend" class="checkbox" checked={data.settings.overspendPrevention} />
    <span>Prevent overspending</span>
  </label>
  <button type="submit" class="btn variant-filled-primary w-full">Save Settings</button>
</form>
