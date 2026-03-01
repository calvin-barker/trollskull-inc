<script lang="ts">
  import { enhance } from '$app/forms';
  import CalendarPicker from '$lib/components/CalendarPicker.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  let showMoonConfig = $state(false);
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

  <!-- Calendar picker -->
  <CalendarPicker currentDate={data.currentDate} fullMoonDate={data.fullMoonDate} />

  <!-- Moon config (collapsible) -->
  <div class="bg-stone-900 rounded-lg border border-stone-800">
    <button
      type="button"
      onclick={() => showMoonConfig = !showMoonConfig}
      class="w-full px-4 py-3 flex items-center justify-between text-sm text-stone-400 hover:text-stone-300 transition-colors"
    >
      <span>Moon Configuration</span>
      <span class="text-xs">{showMoonConfig ? '▲' : '▼'}</span>
    </button>
    {#if showMoonConfig}
      <form method="POST" action="?/setFullMoon" use:enhance class="px-4 pb-4">
        <label class="block text-xs text-stone-500 mb-1">
          Reference full moon date (YYYY-MM-DD)
        </label>
        <div class="flex gap-2">
          <input
            type="text"
            name="date"
            value={data.fullMoonDate}
            pattern="\d{4}-\d{2}-\d{2}"
            class="flex-1 bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100"
          />
          <button
            type="submit"
            class="bg-stone-700 hover:bg-stone-600 text-stone-200 font-semibold px-3 py-1 rounded text-sm transition-colors"
          >
            Set
          </button>
        </div>
      </form>
    {/if}
  </div>

  <!-- Collect Revenue -->
  <div class="bg-stone-900 rounded-lg border border-stone-800 p-4 flex items-center justify-between">
    <div>
      <h3 class="text-sm font-semibold text-stone-300">Collect Daily Revenue</h3>
      <p class="text-xs text-stone-500 mt-1">Tavern: {data.dailyRevenueMin}–{data.dailyRevenueMax} gp (random) · Inn: {data.occupiedRoomRate} gp ({data.occupiedRooms} {data.occupiedRooms === 1 ? 'room' : 'rooms'})</p>
    </div>
    <form method="POST" action="?/collectRevenue" use:enhance>
      <button type="submit" class="bg-emerald-700 hover:bg-emerald-600 text-stone-100 font-semibold px-4 py-2 rounded text-sm transition-colors">
        Collect Revenue
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
                <p class="text-xs text-stone-500">{tx.dateFormatted} · {tx.category}{#if tx.person} · {tx.person}{/if}</p>
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
