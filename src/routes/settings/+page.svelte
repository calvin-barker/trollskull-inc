<script lang="ts">
  import { enhance } from '$app/forms';
</script>

<div class="space-y-6">
  <h2 class="text-xl font-bold text-amber-400">Settings</h2>

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
