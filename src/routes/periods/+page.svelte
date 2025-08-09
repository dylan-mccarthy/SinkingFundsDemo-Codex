<script lang="ts">
  export let data: { periods: { id: string; year: number; month: number; status: string }[] };
</script>

<div class="p-4 space-y-4">
  <h1 class="text-2xl font-bold">Periods</h1>
  <form method="post" action="?/start">
    <button class="btn variant-filled-primary">Start New Month</button>
  </form>
  <table class="table w-full">
    <thead>
      <tr>
        <th>Month</th>
        <th>Status</th>
        <th class="w-1"></th>
      </tr>
    </thead>
    <tbody>
      {#each data.periods as p}
        <tr>
          <td>{p.month}/{p.year}</td>
          <td>{p.status}</td>
          <td>
            {#if p.status === 'OPEN'}
              <form method="post" action="?/close">
                <input type="hidden" name="id" value={p.id} />
                <button class="btn btn-sm">Close</button>
              </form>
            {:else}
              <form method="post" action="?/reopen" class="flex gap-2">
                <input type="hidden" name="id" value={p.id} />
                <input
                  type="text"
                  name="reason"
                  placeholder="Reason"
                  class="input input-sm"
                />
                <button class="btn btn-sm">Reopen</button>
              </form>
            {/if}
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
