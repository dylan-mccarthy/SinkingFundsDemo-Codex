<script lang="ts">
  import type { PageData } from './$types';
  export let data: PageData;

  const formatAmount = (cents: number) => (cents / 100).toFixed(2);
</script>

<h1 class="mb-4 text-2xl font-bold">Transactions</h1>

<ul class="mb-6 space-y-2">
  {#each data.transactions as tx}
    <li class="p-4 rounded-lg border border-surface-200 bg-surface-50 flex justify-between">
      <div>
        <div class="font-semibold">{tx.fund?.name}</div>
        <div class="text-sm text-surface-500">{tx.type} on {new Date(tx.date).toLocaleDateString()}</div>
      </div>
      <div class="font-mono">${formatAmount(tx.amountCents)}</div>
    </li>
  {/each}
</ul>

<form method="post" action="?/create" class="space-y-4 max-w-sm mb-8">
  <select name="fundId" class="select w-full" required>
    <option value="" disabled selected>Select fund</option>
    {#each data.funds as fund}
      <option value={fund.id}>{fund.name}</option>
    {/each}
  </select>
  <select name="type" class="select w-full" required>
    <option value="EXPENSE">Expense</option>
    <option value="INCOME">Income</option>
  </select>
  <input name="amount" type="number" step="0.01" placeholder="Amount" class="input" required />
  <input name="date" type="date" class="input" />
  <input name="payee" placeholder="Payee" class="input" />
  <input name="note" placeholder="Note" class="input" />
  <button type="submit" class="btn variant-filled-primary w-full">Add Transaction</button>
</form>

<form method="post" action="?/transfer" class="space-y-4 max-w-sm">
  <select name="fromFundId" class="select w-full" required>
    <option value="" disabled selected>From fund</option>
    {#each data.funds as fund}
      <option value={fund.id}>{fund.name}</option>
    {/each}
  </select>
  <select name="toFundId" class="select w-full" required>
    <option value="" disabled selected>To fund</option>
    {#each data.funds as fund}
      <option value={fund.id}>{fund.name}</option>
    {/each}
  </select>
  <input name="amount" type="number" step="0.01" placeholder="Amount" class="input" required />
  <input name="date" type="date" class="input" />
  <input name="note" placeholder="Note" class="input" />
  <button type="submit" class="btn variant-filled-primary w-full">Transfer</button>
</form>

