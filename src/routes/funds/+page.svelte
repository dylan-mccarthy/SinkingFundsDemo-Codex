<script lang="ts">
  export let data: {
    funds: Array<{ id: string; name: string; description: string | null; balanceCents: number }>;
  };

  const formatAmount = (cents: number) => (cents / 100).toFixed(2);
</script>

<h1 class="mb-4 text-2xl font-bold">Funds</h1>

<ul class="mb-6 space-y-2">
  {#each data.funds as fund}
    <li>
      <a
        href={`/funds/${fund.id}`}
        class="block p-4 rounded-lg border border-surface-200 bg-surface-50 hover:bg-surface-100"
      >
        <div class="flex justify-between">
          <div class="font-semibold">{fund.name}</div>
          <div class="font-mono">${formatAmount(fund.balanceCents)}</div>
        </div>
        {#if fund.description}
          <div class="text-sm text-surface-500">{fund.description}</div>
        {/if}
      </a>
    </li>
  {/each}
</ul>

<form method="post" action="?/create" class="space-y-4 max-w-sm">
  <input name="name" placeholder="Fund name" class="input" required />
  <input name="description" placeholder="Description" class="input" />
  <button type="submit" class="btn variant-filled-primary w-full">Create</button>
</form>
