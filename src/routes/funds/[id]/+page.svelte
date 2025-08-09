<script lang="ts">
  export let data: {
    fund: { id: string; name: string; description: string | null; balanceCents: number; targetCents?: number | null };
    transactions: Array<{
      id: string;
      type: string;
      amountCents: number;
      date: string;
      payee: string | null;
      note: string | null;
    }>;
    gamification: {
      level: number;
      levelProgressPct: number;
      target: { progressPct: number; achieved: boolean } | null;
    };
  };

  const formatAmount = (cents: number) => (cents / 100).toFixed(2);
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString();
</script>

<a href="/funds" class="text-sm text-primary-600 hover:underline">← Back to funds</a>

<h1 class="mt-2 mb-4 text-2xl font-bold">{data.fund.name}</h1>
{#if data.fund.description}
  <p class="mb-4 text-surface-600">{data.fund.description}</p>
{/if}
<p class="mb-6 text-lg font-semibold">Balance: ${formatAmount(data.fund.balanceCents)}</p>

<div class="mb-6">
  <p class="font-semibold">Level {data.gamification.level}</p>
  <progress
    class="w-full h-2"
    value={data.gamification.levelProgressPct}
    max="100"
    aria-label="Progress to next level"
  ></progress>
</div>

{#if data.gamification.target}
  <div class="mb-6">
    <p class="font-semibold">Goal progress</p>
    <progress
      class="w-full h-2"
      value={data.gamification.target.progressPct}
      max="100"
      aria-label="Progress to fund target"
    ></progress>
    {#if data.gamification.target.achieved}
      <p class="mt-1 text-primary-600">🎉 Goal achieved!</p>
    {/if}
  </div>
{/if}

{#if data.fund.balanceCents === 0}
  <form method="post" action="?/archive" class="mb-6">
    <button class="btn variant-filled-secondary">Archive fund</button>
  </form>
{:else}
  <p class="mb-6 text-sm text-surface-500">Fund must have zero balance to archive.</p>
{/if}

<h2 class="mb-2 text-xl font-semibold">Recent Transactions</h2>
{#if data.transactions.length === 0}
  <p class="text-surface-500">No transactions yet.</p>
{:else}
  <ul class="space-y-2">
    {#each data.transactions as tx}
      <li class="p-3 rounded-md border border-surface-200 bg-surface-50 flex justify-between">
        <div>
          <div class="font-mono">{formatDate(tx.date)}</div>
          {#if tx.payee}
            <div class="text-sm text-surface-500">{tx.payee}</div>
          {/if}
          {#if tx.note}
            <div class="text-xs text-surface-400">{tx.note}</div>
          {/if}
        </div>
        <div class="font-mono {tx.type === 'EXPENSE' || tx.type === 'TRANSFER_OUT' ? 'text-red-600' : 'text-green-600'}">
          ${formatAmount(tx.amountCents)}
        </div>
      </li>
    {/each}
  </ul>
{/if}
