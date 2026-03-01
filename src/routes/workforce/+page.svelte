<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData, ActionData } from './$types';
  let { data, form }: { data: PageData; form: ActionData } = $props();
  let editingStaffId: number | null = $state(null);
  let editingPostingId: number | null = $state(null);
  let payingStaffId: number | null = $state(null);
</script>

<div class="space-y-6">
  <h2 class="text-xl font-bold text-amber-400">Workforce</h2>

  {#if form?.error}<p class="text-red-400 text-sm bg-red-900/20 border border-red-800 rounded px-3 py-2">{form.error}</p>{/if}

  <!-- Staff Roster -->
  <div class="bg-stone-900 border border-stone-800 rounded-lg">
    <div class="px-4 py-3 border-b border-stone-800">
      <h3 class="text-sm font-semibold text-stone-300">Staff Roster</h3>
    </div>
    <table class="w-full text-sm">
      <thead class="text-xs text-stone-400 uppercase border-b border-stone-800">
        <tr>
          <th class="text-left px-4 py-2">Name</th>
          <th class="text-left px-4 py-2">Role</th>
          <th class="text-right px-4 py-2">Wage/day</th>
          <th class="text-left px-4 py-2">Hired</th>
          <th class="text-center px-4 py-2">Status</th>
          <th class="px-2 py-2 w-32"></th>
        </tr>
      </thead>
      <tbody class="divide-y divide-stone-800">
        {#each data.staff as s}
          {#if editingStaffId === s.id}
            <tr>
              <td colspan="6" class="px-4 py-3">
                <form method="POST" action="?/editStaff" use:enhance={() => { return async ({ update }) => { editingStaffId = null; await update(); }; }} class="grid grid-cols-5 gap-2 items-end">
                  <input type="hidden" name="id" value={s.id} />
                  <div>
                    <label class="block text-xs text-stone-400 mb-1">Name</label>
                    <input name="name" value={s.name} required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-xs text-stone-100" />
                  </div>
                  <div>
                    <label class="block text-xs text-stone-400 mb-1">Role</label>
                    <input name="role" value={s.role} required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-xs text-stone-100" />
                  </div>
                  <div>
                    <label class="block text-xs text-stone-400 mb-1">Wage (gp/day)</label>
                    <input name="daily_wage" type="number" min="0" value={s.daily_wage} required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-xs text-stone-100" />
                  </div>
                  <div>
                    <label class="block text-xs text-stone-400 mb-1">Hire Date</label>
                    <input name="hire_date" value={s.hire_date} required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-xs text-stone-100" />
                  </div>
                  <div class="flex gap-1">
                    <button type="submit" class="bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold px-2 py-1 rounded text-xs transition-colors">Save</button>
                    <button type="button" onclick={() => editingStaffId = null} class="bg-stone-700 hover:bg-stone-600 text-stone-300 px-2 py-1 rounded text-xs transition-colors">Cancel</button>
                  </div>
                  <div class="col-span-5">
                    <label class="block text-xs text-stone-400 mb-1">Notes</label>
                    <input name="notes" value={s.notes ?? ''} class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-xs text-stone-100" />
                  </div>
                </form>
              </td>
            </tr>
          {:else}
            <tr>
              <td class="px-4 py-2 text-stone-200">
                {s.name}
                {#if s.notes}<span class="text-xs text-stone-500 ml-1">— {s.notes}</span>{/if}
              </td>
              <td class="px-4 py-2 text-stone-400">{s.role}</td>
              <td class="px-4 py-2 text-right font-mono text-amber-400">{s.daily_wage} gp</td>
              <td class="px-4 py-2 text-stone-400">{s.hireDateFormatted}</td>
              <td class="px-4 py-2 text-center">
                <span class="text-xs px-1.5 py-0.5 rounded {s.status === 'active' ? 'bg-emerald-900 text-emerald-300' : 'bg-stone-700 text-stone-400'}">
                  {s.status}
                </span>
              </td>
              <td class="px-2 py-2 whitespace-nowrap">
                {#if s.status === 'active'}
                  {#if payingStaffId === s.id}
                    <form method="POST" action="?/payStaff" use:enhance={() => { return async ({ update }) => { payingStaffId = null; await update(); }; }} class="inline flex items-center gap-1">
                      <input type="hidden" name="staff_id" value={s.id} />
                      <input type="hidden" name="date_dr" value={data.currentDate} />
                      <input name="days" type="number" min="1" value="10" required class="w-14 bg-stone-800 border border-stone-700 rounded px-1 py-0.5 text-xs text-stone-100" />
                      <button type="submit" class="text-xs bg-emerald-800 hover:bg-emerald-700 text-emerald-200 px-2 py-0.5 rounded transition-colors">Pay</button>
                      <button type="button" onclick={() => payingStaffId = null} class="text-stone-600 hover:text-stone-300 text-xs transition-colors">✕</button>
                    </form>
                  {:else}
                    <button type="button" onclick={() => payingStaffId = s.id} class="text-xs bg-stone-700 hover:bg-stone-600 text-stone-300 px-2 py-0.5 rounded transition-colors">Pay</button>
                  {/if}
                  <button type="button" onclick={() => editingStaffId = s.id} class="text-stone-600 hover:text-amber-400 transition-colors ml-1" title="Edit">&#9998;</button>
                  <form method="POST" action="?/dismissStaff" use:enhance={({ cancel }) => { if (!confirm(`Dismiss ${s.name}?`)) cancel(); }} class="inline">
                    <input type="hidden" name="id" value={s.id} />
                    <button class="text-stone-600 hover:text-red-400 transition-colors ml-1" title="Dismiss">&#10005;</button>
                  </form>
                {/if}
              </td>
            </tr>
          {/if}
        {:else}
          <tr><td colspan="6" class="px-4 py-6 text-center text-stone-500">No staff hired.</td></tr>
        {/each}
      </tbody>
    </table>
    <details class="border-t border-stone-800">
      <summary class="px-4 py-2 text-xs text-stone-400 cursor-pointer hover:text-amber-400">+ Hire Staff</summary>
      <form method="POST" action="?/addStaff" class="p-4 pt-0 grid grid-cols-3 gap-3">
        <div><label class="block text-xs text-stone-400 mb-1">Name</label>
          <input name="name" required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" /></div>
        <div><label class="block text-xs text-stone-400 mb-1">Role</label>
          <input name="role" required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" /></div>
        <div><label class="block text-xs text-stone-400 mb-1">Daily Wage (gp)</label>
          <input name="daily_wage" type="number" min="0" required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" /></div>
        <div><label class="block text-xs text-stone-400 mb-1">Hire Date</label>
          <input name="hire_date" value={data.currentDate} required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" /></div>
        <div class="col-span-2"><label class="block text-xs text-stone-400 mb-1">Notes</label>
          <input name="notes" class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" /></div>
        <div class="col-span-3">
          <button class="bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold px-4 py-1.5 rounded text-sm transition-colors">Hire</button>
        </div>
      </form>
    </details>
  </div>

  <!-- Faction Job Board -->
  <div class="bg-stone-900 border border-stone-800 rounded-lg">
    <div class="px-4 py-3 border-b border-stone-800">
      <h3 class="text-sm font-semibold text-stone-300">Faction Job Board</h3>
    </div>
    <table class="w-full text-sm">
      <thead class="text-xs text-stone-400 uppercase border-b border-stone-800">
        <tr>
          <th class="text-left px-4 py-2">Faction</th>
          <th class="text-left px-4 py-2">Title</th>
          <th class="text-right px-4 py-2">Reward</th>
          <th class="text-left px-4 py-2">Deadline</th>
          <th class="text-center px-4 py-2">Status</th>
          <th class="px-2 py-2 w-24"></th>
        </tr>
      </thead>
      <tbody class="divide-y divide-stone-800">
        {#each data.postings as p}
          {#if editingPostingId === p.id}
            <tr>
              <td colspan="6" class="px-4 py-3">
                <form method="POST" action="?/editPosting" use:enhance={() => { return async ({ update }) => { editingPostingId = null; await update(); }; }} class="grid grid-cols-4 gap-2 items-end">
                  <input type="hidden" name="id" value={p.id} />
                  <div>
                    <label class="block text-xs text-stone-400 mb-1">Faction</label>
                    <input name="faction" value={p.faction} required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-xs text-stone-100" />
                  </div>
                  <div>
                    <label class="block text-xs text-stone-400 mb-1">Title</label>
                    <input name="title" value={p.title} required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-xs text-stone-100" />
                  </div>
                  <div>
                    <label class="block text-xs text-stone-400 mb-1">Reward (gp)</label>
                    <input name="reward" type="number" min="0" value={p.reward} class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-xs text-stone-100" />
                  </div>
                  <div>
                    <label class="block text-xs text-stone-400 mb-1">Deadline</label>
                    <input name="deadline" value={p.deadline ?? ''} class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-xs text-stone-100" />
                  </div>
                  <div class="col-span-3">
                    <label class="block text-xs text-stone-400 mb-1">Description</label>
                    <input name="description" value={p.description ?? ''} class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-xs text-stone-100" />
                  </div>
                  <div class="flex gap-1">
                    <button type="submit" class="bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold px-2 py-1 rounded text-xs transition-colors">Save</button>
                    <button type="button" onclick={() => editingPostingId = null} class="bg-stone-700 hover:bg-stone-600 text-stone-300 px-2 py-1 rounded text-xs transition-colors">Cancel</button>
                  </div>
                  <div class="col-span-4">
                    <label class="block text-xs text-stone-400 mb-1">Notes</label>
                    <input name="notes" value={p.notes ?? ''} class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-xs text-stone-100" />
                  </div>
                </form>
              </td>
            </tr>
          {:else}
            <tr>
              <td class="px-4 py-2 text-stone-200">{p.faction}</td>
              <td class="px-4 py-2 text-stone-200">
                {p.title}
                {#if p.description}<span class="text-xs text-stone-500 ml-1">— {p.description}</span>{/if}
              </td>
              <td class="px-4 py-2 text-right font-mono text-amber-400">{p.reward} gp</td>
              <td class="px-4 py-2 text-stone-400">{p.deadlineFormatted ?? '—'}</td>
              <td class="px-4 py-2 text-center">
                <span class="text-xs px-1.5 py-0.5 rounded
                  {p.status === 'open' ? 'bg-stone-700 text-stone-300' : p.status === 'accepted' ? 'bg-amber-900 text-amber-300' : 'bg-emerald-900 text-emerald-300'}">
                  {p.status}
                </span>
              </td>
              <td class="px-2 py-2 whitespace-nowrap">
                {#if p.status === 'open'}
                  <form method="POST" action="?/acceptPosting" class="inline">
                    <input type="hidden" name="id" value={p.id} />
                    <button class="text-xs bg-amber-800 hover:bg-amber-700 text-amber-200 px-2 py-0.5 rounded transition-colors">Accept</button>
                  </form>
                {:else if p.status === 'accepted'}
                  <form method="POST" action="?/completePosting" class="inline">
                    <input type="hidden" name="id" value={p.id} />
                    <button class="text-xs bg-emerald-800 hover:bg-emerald-700 text-emerald-200 px-2 py-0.5 rounded transition-colors">Complete</button>
                  </form>
                {/if}
                {#if p.status !== 'completed'}
                  <button type="button" onclick={() => editingPostingId = p.id} class="text-stone-600 hover:text-amber-400 transition-colors ml-1" title="Edit">&#9998;</button>
                {/if}
              </td>
            </tr>
          {/if}
        {:else}
          <tr><td colspan="6" class="px-4 py-6 text-center text-stone-500">No faction postings.</td></tr>
        {/each}
      </tbody>
    </table>
    <details class="border-t border-stone-800">
      <summary class="px-4 py-2 text-xs text-stone-400 cursor-pointer hover:text-amber-400">+ New Posting</summary>
      <form method="POST" action="?/addPosting" class="p-4 pt-0 grid grid-cols-3 gap-3">
        <div><label class="block text-xs text-stone-400 mb-1">Faction</label>
          <input name="faction" required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" /></div>
        <div><label class="block text-xs text-stone-400 mb-1">Title</label>
          <input name="title" required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" /></div>
        <div><label class="block text-xs text-stone-400 mb-1">Reward (gp)</label>
          <input name="reward" type="number" min="0" value="0" class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" /></div>
        <div><label class="block text-xs text-stone-400 mb-1">Deadline</label>
          <input name="deadline" class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" /></div>
        <div class="col-span-2"><label class="block text-xs text-stone-400 mb-1">Description</label>
          <input name="description" class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" /></div>
        <div class="col-span-3"><label class="block text-xs text-stone-400 mb-1">Notes</label>
          <input name="notes" class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" /></div>
        <div class="col-span-3">
          <button class="bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold px-4 py-1.5 rounded text-sm transition-colors">Post</button>
        </div>
      </form>
    </details>
  </div>
</div>
