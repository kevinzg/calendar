<script lang="ts">
    import { createCalendar, parseEvents, sampleHolidays, type EventSpec } from '$lib/calendar';
    import { onMount } from 'svelte';

    let currentYear = $state(new Date().getFullYear());
    // svelte-ignore state_referenced_locally
    let userEventsText = $state(sampleHolidays(currentYear));
    let userEvents = $derived(parseEvents(userEventsText, currentYear));
    let spec: EventSpec = $derived.by(() => {
        return Object.entries(userEvents).map(([key, value]) => {
            const [_, m, d] = key.split('-').map(Number);
            return {
                month: m,
                date: d,
                event: value.join('; '),
            };
        });
    });
    let calendar = $derived(createCalendar(currentYear, spec));
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    onMount(() => {
        const savedEvents = localStorage.getItem('events');
        if (savedEvents) {
            userEventsText = savedEvents;
        }
        const savedYear = localStorage.getItem('year');
        if (savedYear) {
            currentYear = parseInt(savedYear, 10);
        }
    });

    $effect(() => {
        localStorage.setItem('events', userEventsText);
    });

    $effect(() => {
        localStorage.setItem('year', `${currentYear}`);
    });
</script>

<div class="print:hidden mx-auto max-w-4xl p-4">
    <h2 class="font-bold text-lg">Events</h2>
    <ul class="text-gray-700">
        <li>Write special dates using this format: <code>Jan 1: New Year</code></li>
        <li>Add a "*" for a ★, or a "+" for a ♥</li>
        <li>Press <kbd>Ctrl</kbd> + <kbd>P</kbd> to print/save to PDF</li>
    </ul>
    <textarea
        class="w-full rounded-lg border p-2 my-2 font-mono"
        placeholder="Dec 25: Christmas"
        rows="4"
        bind:value={userEventsText}
    ></textarea>
</div>

<div class="mx-auto max-w-6xl space-y-3 p-4 print:hidden">
    <!-- Year Selector -->
    <div class="flex items-center justify-center space-x-2">
        <button
            class="rounded-lg bg-gray-200 px-4 py-2 text-gray-700 transition hover:bg-gray-300"
            onclick={() => currentYear--}
        >
            &lt;
        </button>
        <span class="text-2xl font-semibold">{currentYear}</span>
        <button
            class="rounded-lg bg-gray-200 px-4 py-2 text-gray-700 transition hover:bg-gray-300"
            onclick={() => currentYear++}
        >
            &gt;
        </button>
    </div>
</div>

<div class="space-y-8 p-4 font-[Open_Sans]">
    {#each calendar.months as month (month.name)}
        <div class:break-after-page={month.number % 2 === 1 && month.number !== 11}>
            <div class="flex justify-between px-10 py-4 text-4xl">
                <span class="font-bold uppercase">{month.name}</span>
                <span class="font-extrabold">{calendar.year}</span>
            </div>
            <div class="grid-container w-full border border-gray-200 px-2 py-2">
                {#each days as day, i (i)}
                    <div
                        class="h-8 content-center bg-gray-700 text-center text-sm font-semibold text-white"
                        class:weekend-header={[0, 6].includes(i)}
                    >
                        {day}
                    </div>
                {/each}

                {#each month.weeks as week, idx (idx)}
                    {#each week as day (day.date)}
                        <div
                            class:weekend={[0, 6].includes(day.dayOfWeek) && day.thisMonth}
                            class:other-month={!day.thisMonth}
                            class:holiday={day.event}
                            class="relative flex h-14 items-center justify-center text-4xl font-semibold text-gray-700"
                        >
                            {day.date}
                            {#if day.event}
                                <div
                                    class="absolute inset-0 -z-10 flex items-center justify-center rounded-full px-1 text-xs text-gray-300"
                                >
                                    {#if day.event.includes('+')}
                                        <span class="text-[4.8rem] pt-[0.55rem]">♥</span>
                                    {:else if day.event.includes('*')}
                                        <span class="text-[4.5rem] pb-[0.74rem]">★</span>
                                    {:else}
                                        <span class="text-[4.2rem] pb-[0.74rem]">●</span>
                                    {/if}
                                </div>
                            {/if}
                        </div>
                    {/each}
                {/each}
            </div>
        </div>
    {/each}
</div>

<style lang="postcss">
    @reference "tailwindcss";

    .other-month {
        @apply text-gray-300;
    }

    .weekend {
        @apply font-bold text-gray-950;
    }

    .weekend-header {
        @apply bg-gray-950;
    }

    .grid-container {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        grid-template-rows: auto repeat(6, 1fr); /* Header is auto, rest are taller */
        gap: 4px;
    }

    .holiday {
        @apply font-extrabold underline;
    }

    kbd {
        @apply inline-block rounded-sm border border-gray-700 bg-gray-100 px-1 py-0.5 text-sm leading-snug font-bold whitespace-nowrap text-gray-600;
    }
</style>
