<script lang="ts">
  import type { PageData, ActionData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<div class="space-y-6">
  <h2 class="text-xl font-bold text-amber-400">Ledger</h2>

  <!-- Filters -->
  <form method="GET" class="flex flex-wrap gap-3 items-end bg-stone-900 border border-stone-800 rounded-lg p-4">
    <div>
      <label class="block text-xs text-stone-400 mb-1">From (YYYY-MM-DD)</label>
      <input name="from" value={data.filters.from} class="bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100 w-36" />
    </div>
    <div>
      <label class="block text-xs text-stone-400 mb-1">To (YYYY-MM-DD)</label>
      <input name="to" value={data.filters.to} class="bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100 w-36" />
    </div>
    <div>
      <label class="block text-xs text-stone-400 mb-1">Category</label>
      <select name="category" class="bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100">
        <option value="">All</option>
        {#each data.categories as cat}
          <option value={cat} selected={data.filters.category === cat}>{cat}</option>
        {/each}
      </select>
    </div>
    <button type="submit" class="bg-stone-700 hover:bg-stone-600 px-3 py-1 rounded text-sm transition-colors">Filter</button>
    <a href="/ledger" class="text-stone-400 hover:text-stone-200 text-sm py-1">Clear</a>
  </form>

  <!-- Add transaction -->
  <details class="bg-stone-900 border border-stone-800 rounded-lg">
    <summary class="px-4 py-3 text-sm font-semibold text-stone-300 cursor-pointer hover:text-amber-400">+ Add Transaction</summary>
    <form method="POST" action="?/add" class="p-4 pt-0 grid grid-cols-2 gap-3">
      {#if form?.error}
        <p class="col-span-2 text-red-400 text-sm">{form.error}</p>
      {/if}
      <div>
        <label class="block text-xs text-stone-400 mb-1">Date (YYYY-MM-DD)</label>
        <input name="date_dr" value={data.currentDate} required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" />
      </div>
      <div>
        <label class="block text-xs text-stone-400 mb-1">Type</label>
        <select name="type" class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100">
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
      </div>
      <div class="col-span-2">
        <label class="block text-xs text-stone-400 mb-1">Description</label>
        <input name="description" required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" />
      </div>
      <div>
        <label class="block text-xs text-stone-400 mb-1">Amount (gp)</label>
        <input name="amount" type="number" min="1" required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" />
      </div>
      <div>
        <label class="block text-xs text-stone-400 mb-1">Category</label>
        <select name="category" class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100">
          {#each data.categories as cat}
            <option>{cat}</option>
          {/each}
        </select>
      </div>
      <div class="col-span-2">
        <label class="block text-xs text-stone-400 mb-1">Notes (optional)</label>
        <input name="notes" class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" />
      </div>
      <div class="col-span-2">
        <button type="submit" class="bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold px-4 py-1.5 rounded text-sm transition-colors">
          Add Transaction
        </button>
      </div>
    </form>
  </details>

  <!-- Transaction table -->
  <div class="bg-stone-900 border border-stone-800 rounded-lg overflow-hidden">
    <table class="w-full text-sm">
      <thead class="border-b border-stone-800 text-stone-400 text-xs uppercase">
        <tr>
          <th class="text-left px-4 py-2">Date</th>
          <th class="text-left px-4 py-2">Description</th>
          <th class="text-left px-4 py-2">Category</th>
          <th class="text-right px-4 py-2">Amount</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-stone-800">
        {#each data.transactions as tx}
          <tr class="hover:bg-stone-800/50">
            <td class="px-4 py-2 text-stone-400 whitespace-nowrap">{tx.dateFormatted}</td>
            <td class="px-4 py-2 text-stone-200">{tx.description}{#if tx.notes}<span class="text-stone-500 ml-1 text-xs">— {tx.notes}</span>{/if}</td>
            <td class="px-4 py-2 text-stone-400">{tx.category}</td>
            <td class="px-4 py-2 text-right font-mono {tx.amount < 0 ? 'text-red-400' : 'text-emerald-400'}">
              {tx.amount > 0 ? '+' : ''}{tx.amount} gp
            </td>
          </tr>
        {:else}
          <tr><td colspan="4" class="px-4 py-6 text-center text-stone-500">No transactions.</td></tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
