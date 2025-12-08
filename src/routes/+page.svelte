<script lang="ts">
    import { createCalendar, parseEvents, sampleHolidays, type EventSpec } from '$lib/calendar';
    import Heart from '$lib/assets/Heart.svelte';
    import Star from '$lib/assets/Star.svelte';
    import Circle from '$lib/assets/Circle.svelte';
    import Tree from '$lib/assets/Tree.svelte';
    import Cake from '$lib/assets/Cake.svelte';
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

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
    let isShared = false;
    let showCopyMessage = $state(false);

    onMount(() => {
        const hash = window.location.hash.substring(1);
        if (hash) {
            try {
                const decodedState = atob(hash);
                const state = JSON.parse(decodedState);
                if (state.year && state.events) {
                    currentYear = state.year;
                    userEventsText = state.events;
                    isShared = true;
                }
            } catch (e) {
                console.error('Failed to parse shared state:', e);
                loadFromLocalStorage();
            }
        } else {
            loadFromLocalStorage();
        }
    });

    function loadFromLocalStorage() {
        const savedEvents = localStorage.getItem('events');
        if (savedEvents) {
            userEventsText = savedEvents;
        }
        const savedYear = localStorage.getItem('year');
        if (savedYear) {
            currentYear = parseInt(savedYear, 10);
        }
    }

    $effect(() => {
        if (!isShared && browser) {
            localStorage.setItem('events', userEventsText);
        }
    });

    $effect(() => {
        if (!isShared && browser) {
            localStorage.setItem('year', `${currentYear}`);
        }
    });

    function share() {
        const state = {
            year: currentYear,
            events: userEventsText,
        };
        const jsonState = JSON.stringify(state);
        const base64State = btoa(jsonState);
        const url = `${window.location.origin}#${base64State}`;
        navigator.clipboard.writeText(url);
        showCopyMessage = true;
        setTimeout(() => {
            showCopyMessage = false;
        }, 2000);
    }
</script>

<main class="flex flex-col md:flex-row">
    <!-- Control Panel Sidebar -->
    <aside
        class="w-full flex-col space-y-4 bg-gray-50 p-4 print:hidden md:order-first md:h-screen md:w-96 md:sticky md:top-0"
    >
        <h1 class="text-2xl font-bold">Calendar</h1>

        <!-- Year Selector -->
        <div class="rounded-lg border bg-white p-4 pt-2">
            <h2 class="mb-2 text-lg font-semibold">Year</h2>
            <div class="flex items-center justify-between space-x-2">
                <button
                    class="w-12 rounded-lg bg-gray-200 px-4 py-2 font-bold text-gray-700 transition hover:bg-gray-300 text-2xl"
                    onclick={() => currentYear--}
                >
                    &lt;
                </button>
                <span class="text-2xl font-semibold">{currentYear}</span>
                <button
                    class="w-12 rounded-lg bg-gray-200 px-4 py-2 font-bold text-gray-700 transition hover:bg-gray-300 text-2xl"
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
                <li>
                    Decorations:
                    <ul class="pl-2 list-['-']">
                        <li class="pl-1">
                            <Star class="inline w-4"></Star>: <code>[star]</code> or <code>*</code>
                        </li>
                        <li class="pl-1">
                            <Heart class="inline w-4"></Heart>: <code>[heart]</code>
                        </li>
                        <li class="pl-1">
                            <Tree class="inline w-4"></Tree>: <code>[tree]</code>
                        </li>
                        <li class="pl-1">
                            <Cake class="inline w-4"></Cake>: <code>[cake]</code>
                        </li>
                    </ul>
                </li>
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
                class="w-full rounded-lg bg-blue-500 px-4 py-2 text-white transition hover:bg-blue-600 font-bold"
                onclick={() => window.print()}
            >
                Print Calendar
            </button>
        </div>

        <!-- Share Button -->
        <div class="rounded-lg border bg-white p-4 pt-2">
            <h2 class="text-lg font-semibold">Share</h2>
            <p class="mb-2 text-sm text-gray-600">Copy a link to your clipboard.</p>
            <button
                class="w-full rounded-lg bg-green-500 px-4 py-2 text-white transition hover:bg-green-600 font-bold"
                onclick={share}
            >
                {#if showCopyMessage}
                    Copied!
                {:else}
                    Copy Share Link
                {/if}
            </button>
        </div>
    </aside>

    <!-- Calendar View -->
    <div class="flex-1 space-y-8 p-4 font-calendar">
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
                                        class="absolute inset-0 -z-10 flex items-center justify-center text-gray-300 background-icon"
                                    >
                                        {#if day.event.includes('[heart]')}
                                            <Heart />
                                        {:else if day.event.includes('[star]') || day.event.includes('*')}
                                            <Star />
                                        {:else if day.event.includes('[tree]')}
                                            <Tree />
                                        {:else if day.event.includes('[cake]')}
                                            <Cake />
                                        {:else}
                                            <Circle />
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
    @reference 'tailwindcss';

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
        @apply font-extrabold text-gray-950;
    }

    :global(.background-icon svg) {
        @apply h-16 w-16;
    }

    button {
        @apply hover:cursor-pointer;
    }
</style>
