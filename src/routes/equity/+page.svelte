<script lang="ts">
  import type { PageData, ActionData } from './$types';
  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<div class="space-y-6">
  <h2 class="text-xl font-bold text-amber-400">Equity</h2>

  <!-- Shareholder table -->
  <div class="bg-stone-900 border border-stone-800 rounded-lg overflow-hidden">
    <div class="px-4 py-3 border-b border-stone-800 flex justify-between items-center">
      <h3 class="text-sm font-semibold text-stone-300">Shareholders</h3>
      <span class="text-xs text-stone-500">Net Asset Value: <span class="text-stone-300 font-mono">{data.nav} gp</span></span>
    </div>
    <table class="w-full text-sm">
      <thead class="text-xs text-stone-400 uppercase border-b border-stone-800">
        <tr>
          <th class="text-left px-4 py-2">Shareholder</th>
          <th class="text-right px-4 py-2">Shares</th>
          <th class="text-right px-4 py-2">Ownership</th>
          <th class="text-right px-4 py-2">Est. Value</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-stone-800">
        {#each data.shareholders as sh}
          <tr>
            <td class="px-4 py-2 text-stone-200">{sh.name}</td>
            <td class="px-4 py-2 text-right font-mono text-stone-300">{sh.shares}</td>
            <td class="px-4 py-2 text-right text-stone-300">{sh.pct}%</td>
            <td class="px-4 py-2 text-right font-mono text-amber-400">{sh.value} gp</td>
          </tr>
        {:else}
          <tr><td colspan="4" class="px-4 py-6 text-center text-stone-500">No shareholders yet.</td></tr>
        {/each}
      </tbody>
      <tfoot class="border-t border-stone-700 text-stone-400 text-xs">
        <tr>
          <td class="px-4 py-2">Total</td>
          <td class="px-4 py-2 text-right font-mono">{data.totalShares}</td>
          <td colspan="2"></td>
        </tr>
      </tfoot>
    </table>
  </div>

  <div class="grid grid-cols-3 gap-4">
    <!-- Add shareholder -->
    <div class="bg-stone-900 border border-stone-800 rounded-lg p-4">
      <h3 class="text-sm font-semibold text-stone-300 mb-3">Add Shareholder</h3>
      <form method="POST" action="?/addShareholder" class="space-y-2">
        {#if form?.error}<p class="text-red-400 text-xs">{form.error}</p>{/if}
        <input name="name" placeholder="Name" required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" />
        <input name="shares" type="number" min="1" placeholder="Shares" required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" />
        <button class="w-full bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold py-1.5 rounded text-sm transition-colors">Add</button>
      </form>
    </div>

    <!-- Transfer shares -->
    <div class="bg-stone-900 border border-stone-800 rounded-lg p-4">
      <h3 class="text-sm font-semibold text-stone-300 mb-3">Transfer Shares</h3>
      <form method="POST" action="?/transfer" class="space-y-2">
        <select name="from_id" class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100">
          {#each data.shareholders as sh}<option value={sh.id}>{sh.name} ({sh.shares})</option>{/each}
        </select>
        <select name="to_id" class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100">
          {#each data.shareholders as sh}<option value={sh.id}>{sh.name}</option>{/each}
        </select>
        <input name="shares" type="number" min="1" placeholder="Shares to transfer" required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" />
        <button class="w-full bg-stone-700 hover:bg-stone-600 py-1.5 rounded text-sm transition-colors">Transfer</button>
      </form>
    </div>

    <!-- Dividend -->
    <div class="bg-stone-900 border border-stone-800 rounded-lg p-4">
      <h3 class="text-sm font-semibold text-stone-300 mb-3">Distribute Dividend</h3>
      <form method="POST" action="?/dividend" class="space-y-2">
        <input name="date_dr" placeholder="YYYY-MM-DD" required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" />
        <input name="amount" type="number" min="1" placeholder="Total (gp)" required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" />
        <button class="w-full bg-stone-700 hover:bg-stone-600 py-1.5 rounded text-sm transition-colors">Distribute</button>
      </form>
    </div>
  </div>
</div>
