<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData, ActionData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let editingId: number | null = $state(null);
  let customPersonAdd = $state(false);
  let customPersonEdit = $state(false);

  function startEdit(id: number) {
    editingId = id;
    customPersonEdit = false;
  }
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
    <form method="POST" action="?/add" use:enhance class="p-4 pt-0 grid grid-cols-2 gap-3">
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
      <div>
        <label class="block text-xs text-stone-400 mb-1">Person (optional)</label>
        {#if customPersonAdd}
          <div class="flex gap-1">
            <input name="person" placeholder="Name" class="flex-1 bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" />
            <button type="button" onclick={() => customPersonAdd = false} class="text-stone-500 hover:text-stone-300 text-xs px-1">x</button>
          </div>
        {:else}
          <select
            name="person"
            class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100"
            onchange={(e) => { if ((e.target as HTMLSelectElement).value === '__custom__') { customPersonAdd = true; (e.target as HTMLSelectElement).value = ''; } }}
          >
            <option value="">None</option>
            {#each data.shareholderNames as name}
              <option value={name}>{name}</option>
            {/each}
            <option value="__custom__">Other...</option>
          </select>
        {/if}
      </div>
      <div>
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
          <th class="text-left px-4 py-2">Person</th>
          <th class="text-left px-4 py-2">Category</th>
          <th class="text-right px-4 py-2">Amount</th>
          <th class="px-4 py-2 w-8"></th>
        </tr>
      </thead>
      <tbody class="divide-y divide-stone-800">
        {#each data.transactions as tx}
          {#if editingId === tx.id}
            <tr class="bg-stone-800/50">
              <td colspan="6" class="px-4 py-3">
                <form method="POST" action="?/edit" use:enhance={() => { return async ({ update }) => { editingId = null; await update(); }; }} class="grid grid-cols-6 gap-2 items-end">
                  <input type="hidden" name="id" value={tx.id} />
                  <div>
                    <label class="block text-xs text-stone-500 mb-1">Description</label>
                    <input name="description" value={tx.description} required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-xs text-stone-100" />
                  </div>
                  <div>
                    <label class="block text-xs text-stone-500 mb-1">Person</label>
                    {#if customPersonEdit}
                      <div class="flex gap-1">
                        <input name="person" value={tx.person ?? ''} class="flex-1 bg-stone-800 border border-stone-700 rounded px-2 py-1 text-xs text-stone-100" />
                        <button type="button" onclick={() => customPersonEdit = false} class="text-stone-500 hover:text-stone-300 text-xs px-1">x</button>
                      </div>
                    {:else}
                      <select
                        name="person"
                        class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-xs text-stone-100"
                        onchange={(e) => { if ((e.target as HTMLSelectElement).value === '__custom__') { customPersonEdit = true; (e.target as HTMLSelectElement).value = ''; } }}
                      >
                        <option value="">None</option>
                        {#each data.shareholderNames as name}
                          <option value={name} selected={tx.person === name}>{name}</option>
                        {/each}
                        {#if tx.person && !data.shareholderNames.includes(tx.person)}
                          <option value={tx.person} selected>{tx.person}</option>
                        {/if}
                        <option value="__custom__">Other...</option>
                      </select>
                    {/if}
                  </div>
                  <div>
                    <label class="block text-xs text-stone-500 mb-1">Category</label>
                    <select name="category" class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-xs text-stone-100">
                      {#each data.categories as cat}
                        <option selected={tx.category === cat}>{cat}</option>
                      {/each}
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs text-stone-500 mb-1">Type</label>
                    <select name="type" class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-xs text-stone-100">
                      <option value="income" selected={tx.amount >= 0}>Income</option>
                      <option value="expense" selected={tx.amount < 0}>Expense</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs text-stone-500 mb-1">Amount</label>
                    <input name="amount" type="number" min="1" value={Math.abs(tx.amount)} required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-xs text-stone-100" />
                  </div>
                  <div class="flex gap-1">
                    <button type="submit" class="bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold px-2 py-1 rounded text-xs transition-colors">Save</button>
                    <button type="button" onclick={() => editingId = null} class="bg-stone-700 hover:bg-stone-600 text-stone-300 px-2 py-1 rounded text-xs transition-colors">Cancel</button>
                  </div>
                </form>
              </td>
            </tr>
          {:else}
            <tr class="hover:bg-stone-800/50">
              <td class="px-4 py-2 text-stone-400 whitespace-nowrap">{tx.dateFormatted}</td>
              <td class="px-4 py-2 text-stone-200">{tx.description}{#if tx.notes}<span class="text-stone-500 ml-1 text-xs">— {tx.notes}</span>{/if}</td>
              <td class="px-4 py-2 text-stone-400 text-xs">{tx.person ?? ''}</td>
              <td class="px-4 py-2 text-stone-400">{tx.category}</td>
              <td class="px-4 py-2 text-right font-mono {tx.amount < 0 ? 'text-red-400' : 'text-emerald-400'}">
                {tx.amount > 0 ? '+' : ''}{tx.amount} gp
              </td>
              <td class="px-4 py-2 whitespace-nowrap">
                <span class="inline-flex items-center gap-2">
                  <button type="button" onclick={() => startEdit(tx.id)} class="text-stone-600 hover:text-stone-300 transition-colors" title="Edit">&#9998;</button>
                  <form method="POST" action="?/delete" use:enhance={({ cancel }) => { if (!confirm('Delete this transaction?')) cancel(); }} class="inline">
                    <input type="hidden" name="id" value={tx.id} />
                    <button type="submit" class="text-stone-600 hover:text-red-400 transition-colors" title="Delete">&#10005;</button>
                  </form>
                </span>
              </td>
            </tr>
          {/if}
        {:else}
          <tr><td colspan="6" class="px-4 py-6 text-center text-stone-500">No transactions.</td></tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
