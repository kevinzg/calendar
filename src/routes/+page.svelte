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

<main class="flex flex-col md:flex-row">
    <!-- Control Panel Sidebar -->
    <aside class="w-full md:w-96 flex-col space-y-4 bg-gray-50 p-4 print:hidden">
        <h1 class="text-2xl font-bold">Calendar</h1>

        <!-- Year Selector -->
        <div class="rounded-lg border bg-white p-4 pt-2">
            <h2 class="mb-2 text-lg font-semibold">Year</h2>
            <div class="flex items-center justify-between space-x-2">
                <button
                    class="rounded-lg bg-gray-200 px-4 py-2 text-gray-700 transition hover:bg-gray-300 hover:cursor-pointer w-12 font-bold text-2xl"
                    onclick={() => currentYear--}
                >
                    &lt;
                </button>
                <span class="text-2xl font-semibold">{currentYear}</span>
                <button
                    class="rounded-lg bg-gray-200 px-4 py-2 text-gray-700 transition hover:bg-gray-300 hover:cursor-pointer w-12 font-bold text-2xl"
                    onclick={() => currentYear++}
                >
                    &gt;
                </button>
            </div>
        </div>

        <!-- Events Input -->
        <div class="rounded-lg border bg-white p-4 pt-2">
            <h2 class="text-lg font-semibold">Events</h2>
            <ul class="mb-2 text-sm text-gray-600">
                <li>Format: <code>Jan 1: New Year</code></li>
                <li>Use <code>*</code> for a ★, or <code>+</code> for a ♥</li>
            </ul>
            <textarea
                class="w-full rounded-lg border p-2 font-mono"
                placeholder="Dec 25: Christmas"
                rows="8"
                bind:value={userEventsText}
            ></textarea>
        </div>

        <!-- Print Button -->
        <div class="rounded-lg border bg-white p-4 pt-2">
            <h2 class="text-lg font-semibold">Export</h2>
            <p class="mb-2 text-sm text-gray-600">Print the calendar or save it as a PDF.</p>
            <button
                class="w-full rounded-lg bg-blue-500 px-4 py-2 text-white transition hover:bg-blue-600"
                onclick={() => window.print()}
            >
                Print Calendar
            </button>
        </div>
    </aside>

    <!-- Calendar View -->
    <div class="flex-1 space-y-8 overflow-y-auto p-4 font-calendar">
        {#each calendar.months as month (month.name)}
            <div class:break-after-page={month.number % 2 === 1 && month.number !== 11}>
                <div class="flex justify-between px-10 py-4 text-4xl">
                    <span class="font-bold uppercase">{month.name}</span>
                    <span class="font-extrabold">{calendar.year}</span>
                </div>
                <div class="grid-container w-full border border-gray-200 px-2 py-2">
                    {#each days as day, i (i)}
                        <div
                            class="leading-7.5 h-8 bg-gray-600 text-center text-xl font-bold text-white"
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
</main>

<style lang="postcss">
    @reference "tailwindcss";

    .other-month {
        @apply text-gray-300;
    }

    .weekend {
        @apply font-bold text-gray-950;
    }

    .weekend-header {
        @apply bg-gray-900;
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
</style>
