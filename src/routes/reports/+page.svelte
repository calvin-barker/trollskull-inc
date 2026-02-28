<script lang="ts">
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();
</script>

<div class="space-y-6">
  <h2 class="text-xl font-bold text-amber-400">P&L Report</h2>

  <!-- Date range picker -->
  <form method="GET" class="flex flex-wrap gap-3 items-end bg-stone-900 border border-stone-800 rounded-lg p-4">
    <div>
      <label class="block text-xs text-stone-400 mb-1">From (YYYY-MM-DD)</label>
      <input name="from" value={data.from} class="bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100 w-36" />
    </div>
    <div>
      <label class="block text-xs text-stone-400 mb-1">To (YYYY-MM-DD)</label>
      <input name="to" value={data.to} class="bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100 w-36" />
    </div>
    <button type="submit" class="bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold px-3 py-1.5 rounded text-sm transition-colors">
      Run Report
    </button>
  </form>

  <p class="text-stone-400 text-sm">{data.fromFormatted} → {data.toFormatted}</p>

  <div class="grid grid-cols-2 gap-4">
    <!-- Revenue -->
    <div class="bg-stone-900 border border-stone-800 rounded-lg">
      <h3 class="px-4 py-3 text-sm font-semibold text-stone-300 border-b border-stone-800">Revenue</h3>
      <table class="w-full text-sm">
        <tbody class="divide-y divide-stone-800">
          {#each data.revenueRows as row}
            <tr>
              <td class="px-4 py-2 text-stone-300">{row.category}</td>
              <td class="px-4 py-2 text-right text-emerald-400 font-mono">{row.total} gp</td>
            </tr>
          {:else}
            <tr><td colspan="2" class="px-4 py-4 text-stone-500 text-center">No revenue.</td></tr>
          {/each}
        </tbody>
        <tfoot class="border-t border-stone-700">
          <tr>
            <td class="px-4 py-2 font-semibold text-stone-200">Total Revenue</td>
            <td class="px-4 py-2 text-right font-bold text-emerald-400 font-mono">{data.totalRevenue} gp</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Expenses -->
    <div class="bg-stone-900 border border-stone-800 rounded-lg">
      <h3 class="px-4 py-3 text-sm font-semibold text-stone-300 border-b border-stone-800">Expenses</h3>
      <table class="w-full text-sm">
        <tbody class="divide-y divide-stone-800">
          {#each data.expenseRows as row}
            <tr>
              <td class="px-4 py-2 text-stone-300">{row.category}</td>
              <td class="px-4 py-2 text-right text-red-400 font-mono">({row.total} gp)</td>
            </tr>
          {:else}
            <tr><td colspan="2" class="px-4 py-4 text-stone-500 text-center">No expenses.</td></tr>
          {/each}
        </tbody>
        <tfoot class="border-t border-stone-700">
          <tr>
            <td class="px-4 py-2 font-semibold text-stone-200">Total Expenses</td>
            <td class="px-4 py-2 text-right font-bold text-red-400 font-mono">({data.totalExpenses} gp)</td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>

  <!-- Net income and memos -->
  <div class="bg-stone-900 border border-stone-800 rounded-lg p-4 space-y-2">
    <div class="flex justify-between text-lg font-bold">
      <span class="text-stone-200">Net Income</span>
      <span class="{data.netIncome < 0 ? 'text-red-400' : 'text-emerald-400'} font-mono">
        {data.netIncome < 0 ? '(' : ''}{Math.abs(data.netIncome)} gp{data.netIncome < 0 ? ')' : ''}
      </span>
    </div>
    <div class="border-t border-stone-800 pt-2 space-y-1 text-sm text-stone-400">
      <p>Memo — Depreciation (not in cash expenses): {data.depreciationMemo} gp</p>
      <p>Memo — Accrued loan interest (approximate): {data.accruedInterestMemo} gp</p>
    </div>
  </div>
</div>
