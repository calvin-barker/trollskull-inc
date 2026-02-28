<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<div class="space-y-6">
  <!-- Header row -->
  <div class="flex items-start justify-between">
    <div>
      <h2 class="text-2xl font-bold text-amber-400">{data.currentDateFormatted}</h2>
      <p class="text-stone-400 text-sm mt-1">Current in-game date</p>
    </div>
    <div class="text-right">
      <p class="text-3xl font-bold {data.balance < 0 ? 'text-red-400' : 'text-emerald-400'}">
        {data.balance < 0 ? '−' : ''}{Math.abs(data.balance)} gp
      </p>
      <p class="text-stone-400 text-sm mt-1">Cash balance</p>
    </div>
  </div>

  {#if data.balance < 0}
    <div class="bg-red-950 border border-red-800 rounded p-3 text-red-300 text-sm">
      Warning: Cash balance is negative.
    </div>
  {/if}

  <!-- Advance date -->
  <div class="bg-stone-900 rounded-lg p-4 border border-stone-800">
    <h3 class="text-sm font-semibold text-stone-300 mb-3">Advance Date</h3>
    <form method="POST" action="?/advance" class="flex gap-2 items-center">
      <input
        type="number"
        name="days"
        value="1"
        min="1"
        max="365"
        class="w-20 bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100"
      />
      <span class="text-stone-400 text-sm">days</span>
      <button
        type="submit"
        class="bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold px-3 py-1 rounded text-sm transition-colors"
      >
        Advance
      </button>
    </form>
  </div>

  <div class="grid grid-cols-2 gap-4">
    <!-- Recent transactions -->
    <div class="bg-stone-900 rounded-lg border border-stone-800">
      <h3 class="text-sm font-semibold text-stone-300 px-4 py-3 border-b border-stone-800">Recent Transactions</h3>
      {#if data.recentTx.length === 0}
        <p class="text-stone-500 text-sm p-4">No transactions yet.</p>
      {:else}
        <ul class="divide-y divide-stone-800">
          {#each data.recentTx as tx}
            <li class="px-4 py-2 flex justify-between items-center">
              <div>
                <p class="text-sm text-stone-200">{tx.description}</p>
                <p class="text-xs text-stone-500">{tx.dateFormatted} · {tx.category}</p>
              </div>
              <span class="text-sm font-mono {tx.amount < 0 ? 'text-red-400' : 'text-emerald-400'}">
                {tx.amount > 0 ? '+' : ''}{tx.amount} gp
              </span>
            </li>
          {/each}
        </ul>
      {/if}
    </div>

    <!-- Upcoming bookings -->
    <div class="bg-stone-900 rounded-lg border border-stone-800">
      <h3 class="text-sm font-semibold text-stone-300 px-4 py-3 border-b border-stone-800">Upcoming Bookings</h3>
      {#if data.upcomingBookings.length === 0}
        <p class="text-stone-500 text-sm p-4">No upcoming bookings.</p>
      {:else}
        <ul class="divide-y divide-stone-800">
          {#each data.upcomingBookings as b}
            <li class="px-4 py-2">
              <p class="text-sm text-stone-200">{b.guest_name} — {b.room_name}</p>
              <p class="text-xs text-stone-500">{b.checkInFormatted} → {b.checkOutFormatted} · {b.rate} gp/night</p>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  </div>
</div>
