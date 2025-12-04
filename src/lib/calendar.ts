export type Calendar = {
    year: number;
    months: Month[];
};

export type Day = {
    date: number;
    event: string;
    dayOfWeek: number;
    thisMonth: boolean;
};

export type Week = Day[];

export type Month = {
    name: string;
    weeks: Week[]; // 6 weeks
    number: number;
};

export type EventSpec = Array<{ month: number; date: number; event: string }>;

export function createCalendar(year: number, spec: EventSpec): Calendar {
    const months = range(12).map((_, i) => createMonth(year, i, spec));
    return { year, months };
}

function createMonth(year: number, month: number, spec: EventSpec): Month {
    const weeks = createWeeks(year, month, spec);
    return { name: monthName(month), weeks, number: month };
}

function monthName(month: number): string {
    return [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
    ][month];
}

function createWeeks(year: number, month: number, spec: EventSpec): Week[] {
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();

    let prevMonthDays = firstDay;
    let nextMonthDays = 7 * 6 - lastDate - prevMonthDays;

    // Start on 2nd row if first day is Sunday to "center" the month
    if (prevMonthDays === 0) {
        prevMonthDays += 7;
        nextMonthDays -= 7;
    }

    const days = [
        ...range(prevMonthDays).map((i) => ({
            date: new Date(year, month, 1 - prevMonthDays + i).getDate(),
            event: '',
            thisMonth: false,
            dayOfWeek: i % 7,
        })),
        ...range(lastDate).map((date) => ({
            date: date + 1,
            event: spec
                .filter((e) => e.month === month && e.date === date + 1)
                .flatMap((e) => e.event)
                .join('; '),
            thisMonth: true,
            dayOfWeek: (firstDay + date) % 7,
        })),
        ...range(nextMonthDays).map((i) => ({
            date: i + 1,
            event: '',
            thisMonth: false,
            dayOfWeek: (firstDay + lastDate + i) % 7,
        })),
    ];

    return [
        days.slice(0, 7),
        days.slice(7, 14),
        days.slice(14, 21),
        days.slice(21, 28),
        days.slice(28, 35),
        days.slice(35, 42),
    ];
}

function range(n: number): number[] {
    return Array.from({ length: n }, (_, i) => i);
}

export function parseEvents(text: string, currentYear: number): Record<string, string[]> {
    const regex = /([A-Za-z]{3})\s(\d{1,2}):\s(.+)/g;
    const monthsMap: Record<string, number> = {
        Jan: 0,
        Feb: 1,
        Mar: 2,
        Apr: 3,
        May: 4,
        Jun: 5,
        Jul: 6,
        Aug: 7,
        Sep: 8,
        Oct: 9,
        Nov: 10,
        Dec: 11,
    };

    const parsed: Record<string, string[]> = {};
    let match;
    while ((match = regex.exec(text)) !== null) {
        const [_, monthAbbr, day, description] = match;
        const month = monthsMap[monthAbbr];
        if (month === undefined) continue;
        const dayNumber = parseInt(day, 10);
        const key = `${currentYear}-${month}-${dayNumber}`;
        if (!parsed[key]) parsed[key] = [];
        parsed[key].push(description.trim());
    }
    return parsed;
}

function easterDates(year: number): [number, number, string][] {
    // --- Meeus–Jones–Butcher Easter Algorithm ---
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);

    const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = Mar, 4 = Apr
    const day = 1 + ((h + l - 7 * m + 114) % 31);

    // Easter Sunday:
    const easter = new Date(year, month - 1, day);

    // Jueves Santo = Easter − 3 days
    const thursday = new Date(easter);
    thursday.setDate(easter.getDate() - 3);

    // Viernes Santo = Easter − 2 days
    const friday = new Date(easter);
    friday.setDate(easter.getDate() - 2);

    return [
        [thursday.getMonth() + 1, thursday.getDate(), 'Maundy Thursday'],
        [friday.getMonth() + 1, friday.getDate(), 'Good Friday'],
    ];
}

export function sampleHolidays(year: number): string {
    const dates: [number, number, string][] = [
        [1, 1, 'New Year'],
        [2, 14, "Valentine's Day+"],
        [3, 17, "St. Patrick's Day"],
        [4, 1, "April Fool's Day"],
        ...easterDates(year),
        [10, 31, 'Halloween'],
        [12, 24, 'Christmas Eve'],
        [12, 25, 'Christmas*'],
        [12, 31, "New Year's Eve"],
    ];

    return dates
        .map(([month, day, name]) => {
            return `${monthName(month - 1).slice(0, 3)} ${day}: ${name}`;
        })
        .join('\n');
}
