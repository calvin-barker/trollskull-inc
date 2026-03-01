<script lang="ts">
  import { enhance } from '$app/forms';
  import { FR_MONTHS } from '$lib/calendar';
  import { getMoonPhase } from '$lib/moon';

  let { currentDate, fullMoonDate }: { currentDate: string; fullMoonDate: string } = $props();

  function parseParts(d: string) { const p = d.split('-').map(Number); return { y: p[0], m: p[1] - 1 }; }
  const init = parseParts(currentDate);
  let viewYear = $state(init.y);
  let viewMonthIndex = $state(init.m); // 0-based index into FR_MONTHS

  let formEl: HTMLFormElement | undefined = $state();
  let dateInput: HTMLInputElement | undefined = $state();

  const viewMonth = $derived(FR_MONTHS[viewMonthIndex]);

  function prevMonth() {
    if (viewMonthIndex === 0) {
      viewMonthIndex = FR_MONTHS.length - 1;
      viewYear--;
    } else {
      viewMonthIndex--;
    }
  }

  function nextMonth() {
    if (viewMonthIndex === FR_MONTHS.length - 1) {
      viewMonthIndex = 0;
      viewYear++;
    } else {
      viewMonthIndex++;
    }
  }

  function selectDay(day: number) {
    const mm = String(viewMonth.num).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    if (dateInput) dateInput.value = `${viewYear}-${mm}-${dd}`;
    if (formEl) formEl.requestSubmit();
  }

  function moonEmoji(day: number): string | null {
    const mm = String(viewMonth.num).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return getMoonPhase(`${viewYear}-${mm}-${dd}`, fullMoonDate).emoji;
  }

  function isCurrentDate(day: number): boolean {
    const mm = String(viewMonth.num).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${viewYear}-${mm}-${dd}` === currentDate;
  }
</script>

<div class="bg-stone-900 rounded-lg border border-stone-800 p-4">
  <!-- Navigation header -->
  <div class="flex items-center justify-between mb-3">
    <button
      type="button"
      onclick={() => viewYear--}
      class="text-stone-500 hover:text-stone-300 px-1 text-sm transition-colors"
      aria-label="Previous year"
    >&laquo;</button>
    <button
      type="button"
      onclick={prevMonth}
      class="text-stone-500 hover:text-stone-300 px-1 text-sm transition-colors"
      aria-label="Previous month"
    >&lsaquo;</button>

    <div class="text-center">
      <select
        class="bg-transparent text-sm font-semibold text-amber-400 border-none cursor-pointer appearance-none text-center focus:outline-none"
        onchange={(e) => viewMonthIndex = e.currentTarget.selectedIndex}
      >
        {#each FR_MONTHS as month, i}
          <option value={i} selected={i === viewMonthIndex} class="bg-stone-900 text-stone-100">{month.name}</option>
        {/each}
      </select>
      <span class="text-stone-400 font-normal text-sm">{viewYear} DR</span>
    </div>

    <button
      type="button"
      onclick={nextMonth}
      class="text-stone-500 hover:text-stone-300 px-1 text-sm transition-colors"
      aria-label="Next month"
    >&rsaquo;</button>
    <button
      type="button"
      onclick={() => viewYear++}
      class="text-stone-500 hover:text-stone-300 px-1 text-sm transition-colors"
      aria-label="Next year"
    >&raquo;</button>
  </div>

  <!-- Hidden form for date submission -->
  <form method="POST" action="?/setDate" use:enhance bind:this={formEl} class="hidden">
    <input type="hidden" name="date" bind:this={dateInput} />
  </form>

  {#if viewMonth.festival}
    <!-- Festival: single cell -->
    <button
      type="button"
      onclick={() => selectDay(1)}
      class="w-full py-3 rounded text-center text-sm font-semibold transition-colors
        {isCurrentDate(1)
          ? 'bg-amber-600 text-stone-950 ring-2 ring-amber-400'
          : 'bg-amber-900/30 text-amber-300 hover:bg-amber-900/50 border border-amber-800/50'}"
    >
      {#if moonEmoji(1)}<span class="text-lg">{moonEmoji(1)}</span>{/if}
      <span class={moonEmoji(1) ? 'ml-2' : ''}>{viewMonth.name}</span>
    </button>
  {:else}
    <!-- Regular month: 3 tenday rows × 10 columns -->
    <div class="grid grid-cols-10 gap-1">
      {#each { length: 30 } as _, i}
        {@const day = i + 1}
        <button
          type="button"
          onclick={() => selectDay(day)}
          class="aspect-square flex flex-col items-center justify-center rounded text-xs transition-colors
            {isCurrentDate(day)
              ? 'bg-amber-600 text-stone-950 ring-2 ring-amber-400 font-bold'
              : 'bg-stone-800 text-stone-300 hover:bg-stone-700'}"
        >
          <span class="leading-none">{day}</span>
          {#if moonEmoji(day)}<span class="text-[10px] leading-none mt-0.5">{moonEmoji(day)}</span>{/if}
        </button>
      {/each}
    </div>

    <!-- Tenday labels -->
    <div class="grid grid-cols-3 mt-1 text-center">
      <span class="text-[10px] text-stone-600">1st tenday</span>
      <span class="text-[10px] text-stone-600">2nd tenday</span>
      <span class="text-[10px] text-stone-600">3rd tenday</span>
    </div>
  {/if}
</div>
