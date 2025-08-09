<script lang="ts">
import type { PageData } from './$types';
import { formatCurrency } from '$lib/format';

export let data: PageData;

/** Format a transaction date into a locale string. */
const fmtDate = (d: Date) => new Date(d).toLocaleDateString();
</script>

<div class="p-4 space-y-8">
<h1 class="text-3xl font-bold">Dashboard</h1>

<section>
<h2 class="text-xl font-semibold mb-2">Total Balance</h2>
<p class="text-2xl">{formatCurrency(data.totalBalanceCents)}</p>
</section>

<section>
<h2 class="text-xl font-semibold mb-2">Top Funds</h2>
{#if data.topFunds.length}
<ul class="space-y-1">
{#each data.topFunds as fund}
<li class="flex justify-between"><span>{fund.name}</span><span>{formatCurrency(fund.balanceCents)}</span></li>
{/each}
</ul>
{:else}
<p>No funds yet.</p>
{/if}
</section>

<section>
<h2 class="text-xl font-semibold mb-2">Recent Transactions</h2>
{#if data.recentTransactions.length}
<ul class="space-y-1">
{#each data.recentTransactions as tx}
<li class="flex justify-between">
<span>{fmtDate(tx.date)} – {tx.fund?.name ?? 'Unassigned'}</span>
<span>{formatCurrency(tx.amountCents)}</span>
</li>
{/each}
</ul>
{:else}
<p>No transactions yet.</p>
{/if}
</section>

<div class="flex flex-wrap gap-2">
<a href="/funds" class="btn variant-filled-primary">Manage Funds</a>
<a href="/transactions" class="btn variant-filled-primary">Transactions</a>
<a href="/allocations" class="btn variant-filled-primary">Allocations</a>
<a href="/periods" class="btn variant-filled-primary">Periods</a>
<a href="/settings" class="btn variant-filled-primary">Settings</a>
<a href="/backup" class="btn variant-filled-primary">Backup</a>
</div>
</div>
