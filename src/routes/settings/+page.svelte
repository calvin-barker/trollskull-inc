<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();
</script>

<div class="space-y-6">
  <h2 class="text-xl font-bold text-amber-400">Settings</h2>

  <!-- Daily Tavern Revenue -->
  <div class="bg-stone-900 rounded-lg border border-stone-800 p-4">
    <h3 class="text-sm font-semibold text-stone-300 mb-3">Daily Tavern Revenue</h3>
    <p class="text-xs text-stone-500 mb-4">Random gold earned per day when the date advances. A random amount between min and max is rolled for each day.</p>
    <form method="POST" action="?/updateRevenue" use:enhance class="flex items-end gap-3">
      <div>
        <label class="block text-xs text-stone-400 mb-1">Min (gp)</label>
        <input name="min" type="number" min="0" value={data.dailyRevenueMin} required class="w-24 bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" />
      </div>
      <div>
        <label class="block text-xs text-stone-400 mb-1">Max (gp)</label>
        <input name="max" type="number" min="0" value={data.dailyRevenueMax} required class="w-24 bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" />
      </div>
      <button type="submit" class="bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold px-4 py-1.5 rounded text-sm transition-colors">Save</button>
    </form>
  </div>

  <!-- Data Management -->
  <div class="bg-stone-900 rounded-lg border border-stone-800 p-4">
    <h3 class="text-sm font-semibold text-stone-300 mb-3">Data Management</h3>
    <p class="text-xs text-stone-500 mb-4">Generate sample data for testing or clear all data to start fresh.</p>
    <div class="flex gap-3">
      <form method="POST" action="?/seed" use:enhance>
        <button
          type="submit"
          class="bg-emerald-700 hover:bg-emerald-600 text-stone-100 font-semibold px-4 py-2 rounded text-sm transition-colors"
        >
          Generate Sample Data
        </button>
      </form>
      <form
        method="POST"
        action="?/clear"
        use:enhance={({ cancel }) => {
          if (!confirm('Clear ALL data? This cannot be undone.')) {
            cancel();
          }
        }}
      >
        <button
          type="submit"
          class="bg-red-800 hover:bg-red-700 text-stone-100 font-semibold px-4 py-2 rounded text-sm transition-colors"
        >
          Clear All Data
        </button>
      </form>
    </div>
  </div>
</div>
