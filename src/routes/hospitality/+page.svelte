<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData, ActionData } from './$types';
  let { data, form }: { data: PageData; form: ActionData } = $props();
  let editingRoomId: number | null = $state(null);
  let editingBookingId: number | null = $state(null);
</script>

<div class="space-y-6">
  <h2 class="text-xl font-bold text-amber-400">Hospitality</h2>

  <!-- Rooms -->
  <div class="bg-stone-900 border border-stone-800 rounded-lg">
    <div class="px-4 py-3 border-b border-stone-800">
      <h3 class="text-sm font-semibold text-stone-300">Rooms</h3>
    </div>
    <div class="p-4 grid grid-cols-3 gap-3">
      {#each data.rooms as room}
        {#if editingRoomId === room.id}
          <form method="POST" action="?/editRoom" use:enhance={() => { return async ({ update }) => { editingRoomId = null; await update(); }; }} class="bg-stone-800 rounded p-3 border border-amber-700 space-y-2">
            <input type="hidden" name="id" value={room.id} />
            <input name="name" value={room.name} required class="w-full bg-stone-900 border border-stone-700 rounded px-2 py-1 text-xs text-stone-100" />
            <div class="flex gap-2">
              <input name="floor" type="number" value={room.floor ?? ''} placeholder="Floor" class="w-16 bg-stone-900 border border-stone-700 rounded px-2 py-1 text-xs text-stone-100" />
              <input name="rate" type="number" min="0" value={room.rate} required class="w-20 bg-stone-900 border border-stone-700 rounded px-2 py-1 text-xs text-stone-100" />
            </div>
            <input name="description" value={room.description ?? ''} placeholder="Description" class="w-full bg-stone-900 border border-stone-700 rounded px-2 py-1 text-xs text-stone-100" />
            <div class="flex gap-1">
              <button type="submit" class="bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold px-2 py-0.5 rounded text-xs transition-colors">Save</button>
              <button type="button" onclick={() => editingRoomId = null} class="bg-stone-700 hover:bg-stone-600 text-stone-300 px-2 py-0.5 rounded text-xs transition-colors">Cancel</button>
            </div>
          </form>
        {:else}
          <div class="bg-stone-800 rounded p-3 border border-stone-700">
            <div class="flex justify-between items-start">
              <p class="text-stone-200 font-semibold text-sm">{room.name}</p>
              <div class="flex items-center gap-2">
                <button type="button" onclick={() => editingRoomId = room.id} class="text-stone-600 hover:text-stone-300 text-xs transition-colors">edit</button>
                <span class="text-xs px-1.5 py-0.5 rounded {room.occupied ? 'bg-red-900 text-red-300' : 'bg-emerald-900 text-emerald-300'}">
                  {room.occupied ? 'Occupied' : 'Vacant'}
                </span>
              </div>
            </div>
            {#if room.description}<p class="text-xs text-stone-500">{room.description}</p>{/if}
            {#if room.floor !== null}<p class="text-xs text-stone-500">Floor {room.floor}</p>{/if}
            <p class="text-xs text-amber-400 mt-1 font-mono">{room.rate} gp/night</p>
          </div>
        {/if}
      {:else}
        <p class="col-span-3 text-stone-500 text-sm">No rooms configured.</p>
      {/each}
    </div>
    <details class="border-t border-stone-800">
      <summary class="px-4 py-2 text-xs text-stone-400 cursor-pointer hover:text-amber-400">+ Add Room</summary>
      <form method="POST" action="?/addRoom" class="p-4 pt-0 flex flex-wrap gap-2">
        <input name="name" placeholder="Room name" required class="bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100 w-40" />
        <input name="floor" type="number" placeholder="Floor" class="bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100 w-20" />
        <input name="rate" type="number" min="0" placeholder="Rate (gp)" required class="bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100 w-24" />
        <input name="description" placeholder="Description" class="bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100 flex-1" />
        <button class="bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold px-3 py-1 rounded text-sm transition-colors">Add</button>
      </form>
    </details>
  </div>

  <!-- Bookings -->
  <div class="bg-stone-900 border border-stone-800 rounded-lg">
    <div class="px-4 py-3 border-b border-stone-800">
      <h3 class="text-sm font-semibold text-stone-300">Bookings</h3>
    </div>
    <table class="w-full text-sm">
      <thead class="text-xs text-stone-400 uppercase border-b border-stone-800">
        <tr>
          <th class="text-left px-4 py-2">Guest</th>
          <th class="text-left px-4 py-2">Room</th>
          <th class="text-left px-4 py-2">Check-in</th>
          <th class="text-left px-4 py-2">Check-out</th>
          <th class="text-right px-4 py-2">Total (gp)</th>
          <th class="text-center px-4 py-2">Status</th>
          <th class="px-2 py-2 w-16"></th>
        </tr>
      </thead>
      <tbody class="divide-y divide-stone-800">
        {#each data.bookings as b}
          {#if editingBookingId === b.id}
            <tr>
              <td colspan="7" class="px-4 py-3">
                <form method="POST" action="?/editBooking" use:enhance={() => { return async ({ update }) => { editingBookingId = null; await update(); }; }} class="grid grid-cols-6 gap-2 items-end">
                  <input type="hidden" name="id" value={b.id} />
                  <div>
                    <label class="block text-xs text-stone-400 mb-1">Guest</label>
                    <input name="guest_name" value={b.guest_name} required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-xs text-stone-100" />
                  </div>
                  <div>
                    <label class="block text-xs text-stone-400 mb-1">Room</label>
                    <select name="room_id" class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-xs text-stone-100">
                      {#each data.rooms as r}<option value={r.id} selected={r.id === b.room_id}>{r.name}</option>{/each}
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs text-stone-400 mb-1">Check-in</label>
                    <input name="check_in" value={b.check_in} required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-xs text-stone-100" />
                  </div>
                  <div>
                    <label class="block text-xs text-stone-400 mb-1">Check-out</label>
                    <input name="check_out" value={b.check_out} required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-xs text-stone-100" />
                  </div>
                  <div>
                    <label class="block text-xs text-stone-400 mb-1">Rate (gp)</label>
                    <input name="rate" type="number" min="0" value={b.rate} required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-xs text-stone-100" />
                  </div>
                  <div class="flex gap-1">
                    <button type="submit" class="bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold px-2 py-1 rounded text-xs transition-colors">Save</button>
                    <button type="button" onclick={() => editingBookingId = null} class="bg-stone-700 hover:bg-stone-600 text-stone-300 px-2 py-1 rounded text-xs transition-colors">Cancel</button>
                  </div>
                  <div class="col-span-6">
                    <label class="block text-xs text-stone-400 mb-1">Notes</label>
                    <input name="notes" value={b.notes ?? ''} class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-xs text-stone-100" />
                  </div>
                </form>
              </td>
            </tr>
          {:else}
            <tr>
              <td class="px-4 py-2 text-stone-200">
                {b.guest_name}
                {#if b.notes}<span class="text-xs text-stone-500 ml-1">— {b.notes}</span>{/if}
              </td>
              <td class="px-4 py-2 text-stone-400">{b.roomName}</td>
              <td class="px-4 py-2 text-stone-400">{b.checkInFormatted}</td>
              <td class="px-4 py-2 text-stone-400">{b.checkOutFormatted}</td>
              <td class="px-4 py-2 text-right font-mono text-amber-400 whitespace-nowrap">{b.total}</td>
              <td class="px-4 py-2 text-center whitespace-nowrap">
                {#if b.status === 'paid'}
                  <span class="text-xs text-stone-500">Paid</span>
                {:else if b.status === 'upcoming'}
                  <span class="text-xs text-stone-500">Upcoming</span>
                {:else if b.status === 'past'}
                  <span class="text-xs text-yellow-500">Overdue</span>
                {:else}
                  <form method="POST" action="?/checkout" class="inline">
                    <input type="hidden" name="booking_id" value={b.id} />
                    <button class="text-xs bg-emerald-800 hover:bg-emerald-700 text-emerald-200 px-2 py-0.5 rounded transition-colors">Check out</button>
                  </form>
                {/if}
              </td>
              <td class="px-2 py-2 whitespace-nowrap">
                {#if b.status !== 'paid'}
                  <button type="button" onclick={() => editingBookingId = b.id} class="text-stone-600 hover:text-amber-400 transition-colors" title="Edit">&#9998;</button>
                  {#if b.status === 'upcoming'}
                    <form method="POST" action="?/deleteBooking" use:enhance={({ cancel }) => { if (!confirm(`Cancel booking for ${b.guest_name}?`)) cancel(); }} class="inline">
                      <input type="hidden" name="id" value={b.id} />
                      <button class="text-stone-600 hover:text-red-400 transition-colors ml-1" title="Cancel booking">&#10005;</button>
                    </form>
                  {/if}
                {/if}
              </td>
            </tr>
          {/if}
        {:else}
          <tr><td colspan="7" class="px-4 py-6 text-center text-stone-500">No bookings.</td></tr>
        {/each}
      </tbody>
    </table>
    <details class="border-t border-stone-800">
      <summary class="px-4 py-2 text-xs text-stone-400 cursor-pointer hover:text-amber-400">+ New Booking</summary>
      <form method="POST" action="?/addBooking" class="p-4 pt-0 grid grid-cols-3 gap-3">
        {#if form?.error}<p class="col-span-3 text-red-400 text-sm">{form.error}</p>{/if}
        <div><label class="block text-xs text-stone-400 mb-1">Room</label>
          <select name="room_id" class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100">
            {#each data.rooms as r}<option value={r.id}>{r.name}</option>{/each}
          </select></div>
        <div><label class="block text-xs text-stone-400 mb-1">Guest Name</label>
          <input name="guest_name" required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" /></div>
        <div><label class="block text-xs text-stone-400 mb-1">Rate (gp/night)</label>
          <input name="rate" type="number" min="0" required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" /></div>
        <div><label class="block text-xs text-stone-400 mb-1">Check-in (YYYY-MM-DD)</label>
          <input name="check_in" value={data.currentDate} required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" /></div>
        <div><label class="block text-xs text-stone-400 mb-1">Check-out (YYYY-MM-DD)</label>
          <input name="check_out" required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" /></div>
        <div><label class="block text-xs text-stone-400 mb-1">Notes</label>
          <input name="notes" class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" /></div>
        <div class="col-span-3">
          <button class="bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold px-4 py-1.5 rounded text-sm transition-colors">Book</button>
        </div>
      </form>
    </details>
  </div>

  <!-- Events -->
  <div class="bg-stone-900 border border-stone-800 rounded-lg">
    <div class="px-4 py-3 border-b border-stone-800"><h3 class="text-sm font-semibold text-stone-300">Events</h3></div>
    <table class="w-full text-sm">
      <thead class="text-xs text-stone-400 uppercase border-b border-stone-800">
        <tr>
          <th class="text-left px-4 py-2">Event</th>
          <th class="text-left px-4 py-2">Date</th>
          <th class="text-right px-4 py-2">Revenue</th>
          <th class="text-right px-4 py-2">Cost</th>
          <th class="text-right px-4 py-2">Net</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-stone-800">
        {#each data.events as e}
          <tr>
            <td class="px-4 py-2 text-stone-200">{e.name}{#if e.description}<span class="text-xs text-stone-500 ml-1">— {e.description}</span>{/if}</td>
            <td class="px-4 py-2 text-stone-400">{e.dateFormatted}</td>
            <td class="px-4 py-2 text-right font-mono text-emerald-400">{e.revenue} gp</td>
            <td class="px-4 py-2 text-right font-mono text-red-400">({e.cost} gp)</td>
            <td class="px-4 py-2 text-right font-mono {e.revenue - e.cost >= 0 ? 'text-emerald-400' : 'text-red-400'}">{e.revenue - e.cost} gp</td>
          </tr>
        {:else}
          <tr><td colspan="5" class="px-4 py-6 text-center text-stone-500">No events.</td></tr>
        {/each}
      </tbody>
    </table>
    <details class="border-t border-stone-800">
      <summary class="px-4 py-2 text-xs text-stone-400 cursor-pointer hover:text-amber-400">+ New Event</summary>
      <form method="POST" action="?/addEvent" class="p-4 pt-0 grid grid-cols-3 gap-3">
        <div class="col-span-2"><label class="block text-xs text-stone-400 mb-1">Event Name</label>
          <input name="name" required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" /></div>
        <div><label class="block text-xs text-stone-400 mb-1">Date</label>
          <input name="date_dr" value={data.currentDate} required class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" /></div>
        <div><label class="block text-xs text-stone-400 mb-1">Revenue (gp)</label>
          <input name="revenue" type="number" min="0" value="0" class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" /></div>
        <div><label class="block text-xs text-stone-400 mb-1">Cost (gp)</label>
          <input name="cost" type="number" min="0" value="0" class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" /></div>
        <div><label class="block text-xs text-stone-400 mb-1">Description</label>
          <input name="description" class="w-full bg-stone-800 border border-stone-700 rounded px-2 py-1 text-sm text-stone-100" /></div>
        <div class="col-span-3">
          <button class="bg-amber-600 hover:bg-amber-500 text-stone-950 font-semibold px-4 py-1.5 rounded text-sm transition-colors">Add Event</button>
        </div>
      </form>
    </details>
  </div>
</div>
