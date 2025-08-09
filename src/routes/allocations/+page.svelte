<script lang="ts">
  import type { PageData } from './$types';
  export let data: PageData;

  const formatPercent = (bp: number | null) =>
    bp !== null ? (bp / 100).toFixed(2) + '%' : '-';
  const formatAmount = (cents: number | null) =>
    cents !== null ? (cents / 100).toFixed(2) : '-';
</script>

<h1 class="mb-4 text-2xl font-bold">Allocation Rules</h1>

<ul class="mb-6 space-y-2">
  {#each data.rules as rule}
    <li class="p-4 rounded-lg border border-surface-200 bg-surface-50">
      <div class="font-semibold">{rule.fund.name}</div>
      <div class="text-sm text-surface-500">
        {#if rule.mode === 'PERCENT'}
          {formatPercent(rule.percentBp)} of deposit
        {:else}
          ${formatAmount(rule.fixedCents)} fixed
        {/if}
        {#if rule.priority > 0}
          , priority {rule.priority}
        {/if}
      </div>
    </li>
  {/each}
</ul>

<form method="post" action="?/create" class="space-y-4 max-w-sm">
  <select name="fundId" class="select w-full" required>
    <option value="" disabled selected>Select fund</option>
    {#each data.funds as fund}
      <option value={fund.id}>{fund.name}</option>
    {/each}
  </select>
  <select name="mode" class="select w-full" required>
    <option value="PERCENT">Percent</option>
    <option value="FIXED">Fixed Amount</option>
  </select>
  <input name="percent" type="number" step="0.01" placeholder="Percent %" class="input" />
  <input name="fixed" type="number" step="0.01" placeholder="Fixed amount" class="input" />
  <input name="priority" type="number" placeholder="Priority" class="input" />
  <button type="submit" class="btn variant-filled-primary w-full">Add Rule</button>
</form>

