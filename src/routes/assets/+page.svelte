<script lang="ts">
  import type { PageData, ActionData } from './$types';
  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <h2 class="text-xl font-bold text-amber-400">Capital Assets</h2>
    <span class="text-sm text-stone-400">Total Book Value: <span class="text-amber-400 font-mono">{data.totalBookValue} gp</span></span>
  </div>

  <!-- Add asset -->
  <details class="bg-stone-900 border border-stone-800 rounded-lg">
    <summary class="px-4 py-3 text-sm font-semibold text-stone-300 cursor-pointer hover:text-amber-400">+ Add Asset</summary>
    <form method="POST" action="?/add" class="p-4 pt-0 grid grid-cols-3 gap-3">
      {#if form?.error}<p class="col-span-3 text-red-400 text-sm">{form.error}</p>{/if}
      <div class="col-span-2"><label class="block text-xs text-stone-400 mb-1">Name</label>
        <input name="name" required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" /></div>
      <div><label class="block text-xs text-stone-400 mb-1">Purchase Date</label>
        <input name="purchase_date" value={data.currentDate} required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" /></div>
      <div><label class="block text-xs text-stone-400 mb-1">Cost (gp)</label>
        <input name="cost" type="number" min="1" required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" /></div>
      <div><label class="block text-xs text-stone-400 mb-1">Useful Life (days)</label>
        <input name="useful_life_days" type="number" min="1" required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" /></div>
      <div><label class="block text-xs text-stone-400 mb-1">Salvage Value (gp)</label>
        <input name="salvage_value" type="number" min="0" value="0" class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" /></div>
      <div class="col-span-3"><label class="block text-xs text-stone-400 mb-1">Description (optional)</label>
        <input name="description" class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" /></div>
      <div class="col-span-3">
        <button class="bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold px-4 py-1.5 rounded text-sm transition-colors">Add Asset</button>
      </div>
    </form>
  </details>

  <!-- Asset table -->
  <div class="bg-stone-900 border border-stone-800 rounded-lg overflow-hidden">
    <table class="w-full text-sm">
      <thead class="text-xs text-stone-400 uppercase border-b border-stone-800">
        <tr>
          <th class="text-left px-4 py-2">Asset</th>
          <th class="text-right px-4 py-2">Cost</th>
          <th class="text-right px-4 py-2">Age (days)</th>
          <th class="text-right px-4 py-2">Accum. Dep.</th>
          <th class="text-right px-4 py-2">Book Value</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-stone-800">
        {#each data.assets as a}
          <tr class="{a.fullyDepreciated ? 'opacity-50' : ''}">
            <td class="px-4 py-2">
              <p class="text-stone-200">{a.name}</p>
              <p class="text-xs text-stone-500">{a.purchaseDateFormatted}{#if a.description} · {a.description}{/if}</p>
            </td>
            <td class="px-4 py-2 text-right font-mono text-stone-300">{a.cost} gp</td>
            <td class="px-4 py-2 text-right text-stone-400">{a.age} / {a.useful_life_days}</td>
            <td class="px-4 py-2 text-right font-mono text-red-400">({a.accumulated} gp)</td>
            <td class="px-4 py-2 text-right font-mono text-amber-400">{a.bookValue} gp</td>
          </tr>
        {:else}
          <tr><td colspan="5" class="px-4 py-6 text-center text-stone-500">No assets recorded.</td></tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
