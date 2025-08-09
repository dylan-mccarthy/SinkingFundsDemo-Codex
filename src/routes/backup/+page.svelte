<script lang="ts">
  export let data: { success?: boolean; error?: string };
</script>

<div class="p-4 space-y-4">
  <h1 class="text-2xl font-bold">Backup</h1>
  <p>Download or restore your data.</p>
  <a href="/api/backup" class="btn variant-filled-primary">Download Backup</a>

  <form method="post" enctype="multipart/form-data" class="flex flex-col gap-2 max-w-sm mt-4">
    <input type="file" name="file" accept="application/json" required />
    <button type="submit" class="btn variant-filled-primary">Import Backup</button>
  </form>

  {#if data.success}
    <p class="text-green-600">Import successful.</p>
  {:else if data.error}
    <p class="text-red-600">{data.error}</p>
  {/if}
</div>
