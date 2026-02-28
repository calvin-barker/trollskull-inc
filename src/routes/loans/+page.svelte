<script lang="ts">
  import type { PageData, ActionData } from './$types';
  let { data, form }: { data: PageData; form: ActionData } = $props();
</script>

<div class="space-y-6">
  <h2 class="text-xl font-bold text-amber-400">Loans</h2>

  <!-- Add loan form -->
  <details class="bg-stone-900 border border-stone-800 rounded-lg">
    <summary class="px-4 py-3 text-sm font-semibold text-stone-300 cursor-pointer hover:text-amber-400">+ New Loan</summary>
    <form method="POST" action="?/addLoan" class="p-4 pt-0 grid grid-cols-3 gap-3">
      {#if form?.error}<p class="col-span-3 text-red-400 text-sm">{form.error}</p>{/if}
      <div><label class="block text-xs text-stone-400 mb-1">Lender</label>
        <input name="lender" required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" /></div>
      <div><label class="block text-xs text-stone-400 mb-1">Principal (gp)</label>
        <input name="principal" type="number" min="1" required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" /></div>
      <div><label class="block text-xs text-stone-400 mb-1">Monthly Rate (%)</label>
        <input name="interest_rate" type="number" min="0" step="0.1" required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" /></div>
      <div><label class="block text-xs text-stone-400 mb-1">Start Date</label>
        <input name="start_date" value={data.currentDate} required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" /></div>
      <div><label class="block text-xs text-stone-400 mb-1">Term (days)</label>
        <input name="term_days" type="number" min="1" required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" /></div>
      <div class="flex items-end">
        <button class="w-full bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold py-1.5 rounded text-sm transition-colors">Add Loan</button>
      </div>
    </form>
  </details>

  <!-- Loan list -->
  {#each data.loans as loan}
    <div class="bg-stone-900 border border-stone-800 rounded-lg">
      <div class="px-4 py-3 border-b border-stone-800 flex justify-between items-center">
        <div>
          <span class="text-stone-200 font-semibold">{loan.lender}</span>
          <span class="ml-2 text-xs text-stone-500">{loan.startDateFormatted} · {loan.interest_rate * 100}%/mo · {loan.term_days} days</span>
        </div>
        <span class="text-xs px-2 py-0.5 rounded {loan.status === 'active' ? 'bg-amber-900 text-amber-300' : 'bg-stone-800 text-stone-400'}">
          {loan.status}
        </span>
      </div>

      <div class="p-4 grid grid-cols-4 gap-4 text-sm">
        <div><p class="text-xs text-stone-500">Original</p><p class="font-mono text-stone-300">{loan.principal} gp</p></div>
        <div><p class="text-xs text-stone-500">Outstanding</p><p class="font-mono text-amber-400">{loan.amort.outstanding} gp</p></div>
        <div><p class="text-xs text-stone-500">Accrued Interest</p><p class="font-mono text-red-400">{loan.amort.accruedInterest} gp</p></div>
        <div><p class="text-xs text-stone-500">Due</p><p class="text-stone-300">{loan.amort.dueDateFormatted}</p></div>
      </div>

      {#if loan.status === 'active'}
        <div class="border-t border-stone-800 p-4">
          <form method="POST" action="?/makePayment" class="flex flex-wrap gap-2 items-end">
            <input type="hidden" name="loan_id" value={loan.id} />
            <div><label class="block text-xs text-stone-400 mb-1">Date</label>
              <input name="date_dr" value={data.currentDate} class="bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100 w-32" /></div>
            <div><label class="block text-xs text-stone-400 mb-1">Principal (gp)</label>
              <input name="principal_portion" type="number" min="0" value="0" class="bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100 w-24" /></div>
            <div><label class="block text-xs text-stone-400 mb-1">Interest (gp)</label>
              <input name="interest_portion" type="number" min="0" value="0" class="bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100 w-24" /></div>
            <button class="bg-stone-700 hover:bg-stone-600 px-3 py-1.5 rounded text-sm transition-colors">Record Payment</button>
          </form>
        </div>
      {/if}
    </div>
  {:else}
    <p class="text-stone-500 text-sm">No loans recorded.</p>
  {/each}
</div>
