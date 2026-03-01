<script lang="ts">
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <h2 class="text-xl font-bold text-amber-400">Balance Sheet</h2>
    <span class="text-xs text-stone-500">As of {data.currentDateFormatted}</span>
  </div>

  <!-- Summary bar -->
  <div class="grid grid-cols-3 gap-4">
    <div class="bg-stone-900 border border-stone-800 rounded-lg p-4 text-center">
      <p class="text-xs text-stone-500 uppercase mb-1">Total Assets</p>
      <p class="text-2xl font-bold text-emerald-400 font-mono">{data.totalAssets} gp</p>
    </div>
    <div class="bg-stone-900 border border-stone-800 rounded-lg p-4 text-center">
      <p class="text-xs text-stone-500 uppercase mb-1">Total Liabilities</p>
      <p class="text-2xl font-bold text-red-400 font-mono">{data.totalDebt} gp</p>
    </div>
    <div class="bg-stone-900 border border-stone-800 rounded-lg p-4 text-center">
      <p class="text-xs text-stone-500 uppercase mb-1">Net Worth</p>
      <p class="text-2xl font-bold {data.netWorth >= 0 ? 'text-amber-400' : 'text-red-400'} font-mono">{data.netWorth} gp</p>
    </div>
  </div>

  <div class="grid grid-cols-2 gap-4">
    <!-- Assets -->
    <div class="bg-stone-900 border border-stone-800 rounded-lg overflow-hidden">
      <div class="px-4 py-3 border-b border-stone-800 flex justify-between items-center">
        <h3 class="text-sm font-semibold text-stone-300">Assets</h3>
        <a href="/assets" class="text-xs text-stone-500 hover:text-amber-400 transition-colors">Manage</a>
      </div>
      <table class="w-full text-sm">
        <tbody class="divide-y divide-stone-800">
          <tr class="bg-stone-800/30">
            <td class="px-4 py-2 text-stone-200">Cash</td>
            <td class="px-4 py-2 text-right font-mono {data.cash >= 0 ? 'text-emerald-400' : 'text-red-400'}">{data.cash} gp</td>
          </tr>
          {#each data.assets as asset}
            <tr>
              <td class="px-4 py-2 text-stone-300">
                {asset.name}
                {#if asset.fullyDepreciated}<span class="text-stone-600 text-xs ml-1">(fully depreciated)</span>{/if}
              </td>
              <td class="px-4 py-2 text-right font-mono text-stone-400">{asset.bookValue} gp</td>
            </tr>
          {/each}
        </tbody>
        <tfoot class="border-t border-stone-700">
          <tr>
            <td class="px-4 py-2 text-stone-300 font-semibold text-xs uppercase">Total Assets</td>
            <td class="px-4 py-2 text-right font-mono text-emerald-400 font-semibold">{data.totalAssets} gp</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Liabilities -->
    <div class="bg-stone-900 border border-stone-800 rounded-lg overflow-hidden">
      <div class="px-4 py-3 border-b border-stone-800 flex justify-between items-center">
        <h3 class="text-sm font-semibold text-stone-300">Liabilities</h3>
        <a href="/loans" class="text-xs text-stone-500 hover:text-amber-400 transition-colors">Manage</a>
      </div>
      <table class="w-full text-sm">
        <tbody class="divide-y divide-stone-800">
          {#each data.loans as loan}
            <tr>
              <td class="px-4 py-2 text-stone-300">
                {loan.lender}
                <span class="text-stone-600 text-xs ml-1">({loan.startDateFormatted})</span>
              </td>
              <td class="px-4 py-2 text-right font-mono text-red-400">{loan.outstanding} gp</td>
            </tr>
          {:else}
            <tr><td colspan="2" class="px-4 py-4 text-center text-stone-500 text-xs">No outstanding loans.</td></tr>
          {/each}
        </tbody>
        <tfoot class="border-t border-stone-700">
          <tr>
            <td class="px-4 py-2 text-stone-300 font-semibold text-xs uppercase">Total Liabilities</td>
            <td class="px-4 py-2 text-right font-mono text-red-400 font-semibold">{data.totalDebt} gp</td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</div>
