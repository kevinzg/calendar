import { describe, it, expect } from 'vitest';
import { createCalendar, parseEvents, sampleHolidays } from './calendar';

describe('createCalendar', () => {
    it('should create a calendar for the given year', () => {
        const year = 2024;
        const spec: Parameters<typeof createCalendar>[1] = [];
        const calendar = createCalendar(year, spec);

        expect(calendar.year).toBe(year);
        expect(calendar.months.length).toBe(12);
        // Basic check for January 2024
        expect(calendar.months[0].name).toBe('January');
        expect(calendar.months[0].weeks.length).toBe(6);
        expect(calendar.months[0].weeks[0][0].date).toBe(31); // Dec 31, 2023
        expect(calendar.months[0].weeks[0][1].date).toBe(1); // Jan 1, 2024
    });

    it('should correctly place events on the calendar', () => {
        const year = 2024;
        const spec = [
            { month: 0, date: 1, event: 'New Year' }, // January 1
            { month: 1, date: 14, event: "Valentine's Day" }, // February 14
        ];
        const calendar = createCalendar(year, spec);

        // Check January 1
        const jan1 = calendar.months[0].weeks.flat().find((day) => day.thisMonth && day.date === 1);
        expect(jan1?.event).toContain('New Year');

        // Check February 14
        const feb14 = calendar.months[1].weeks
            .flat()
            .find((day) => day.thisMonth && day.date === 14);
        expect(feb14?.event).toContain("Valentine's Day");
    });

    it('should handle multiple events on the same day', () => {
        const year = 2024;
        const spec = [
            { month: 0, date: 1, event: 'Event A' },
            { month: 0, date: 1, event: 'Event B' },
        ];
        const calendar = createCalendar(year, spec);
        const jan1 = calendar.months[0].weeks.flat().find((day) => day.thisMonth && day.date === 1);
        expect(jan1?.event).toContain('Event A; Event B');
    });

    it('should show correct days for other months', () => {
        const year = 2024;
        const spec: Parameters<typeof createCalendar>[1] = [];
        const calendar = createCalendar(year, spec);

        // Check December 2023 days in January 2024
        const janMonth = calendar.months[0];
        const dec31 = janMonth.weeks[0][0]; // Sunday, Dec 31
        expect(dec31.date).toBe(31);
        expect(dec31.thisMonth).toBe(false);

        // Check February 2024 (leap year) has 29 days
        const febMonth = calendar.months[1];
        const feb29 = febMonth.weeks.flat().find((day) => day.thisMonth && day.date === 29);
        expect(feb29).toBeDefined();

        // Check February 2023 (not a leap year) has 28 days
        const calendar2023 = createCalendar(2023, spec);
        const febMonth2023 = calendar2023.months[1];
        const feb29_2023 = febMonth2023.weeks
            .flat()
            .find((day) => day.thisMonth && day.date === 29);
        expect(feb29_2023).toBeUndefined();
    });
});

describe('parseEvents', () => {
    const currentYear = 2024;

    it('should correctly parse a single event', () => {
        const text = 'Jan 1: New Year';
        const parsed = parseEvents(text, currentYear);
        expect(parsed).toEqual({
            '2024-0-1': ['New Year'],
        });
    });

    it('should correctly parse multiple events on different dates', () => {
        const text = "Jan 1: New Year\nFeb 14: Valentine's Day";
        const parsed = parseEvents(text, currentYear);
        expect(parsed).toEqual({
            '2024-0-1': ['New Year'],
            '2024-1-14': ["Valentine's Day"],
        });
    });

    it('should handle multiple events on the same date', () => {
        const text = 'Jan 1: Event A\nJan 1: Event B';
        const parsed = parseEvents(text, currentYear);
        expect(parsed).toEqual({
            '2024-0-1': ['Event A', 'Event B'],
        });
    });

    it('should ignore invalid event lines', () => {
        const text = 'Jan 1: Valid Event\nInvalid line\nFeb 29: Another Valid Event';
        const parsed = parseEvents(text, currentYear);
        expect(parsed).toEqual({
            '2024-0-1': ['Valid Event'],
            '2024-1-29': ['Another Valid Event'],
        });
    });

    it('should trim whitespace from event descriptions', () => {
        const text = 'Jan 1:   New Year   ';
        const parsed = parseEvents(text, currentYear);
        expect(parsed).toEqual({
            '2024-0-1': ['New Year'],
        });
    });

    it('should return an empty object for empty input', () => {
        const text = '';
        const parsed = parseEvents(text, currentYear);
        expect(parsed).toEqual({});
    });

    it('should handle months with different abbreviations', () => {
        const text = 'Mar 10: Event A\nJul 20: Event B\nDec 25: Event C';
        const parsed = parseEvents(text, currentYear);
        expect(parsed).toEqual({
            '2024-2-10': ['Event A'],
            '2024-6-20': ['Event B'],
            '2024-11-25': ['Event C'],
        });
    });

    it('should ignore lines starting with #', () => {
        const text =
            "# This is a comment\nJan 1: New Year\n# Jan 15: Another comment\nFeb 14: Valentine's Day";
        const parsed = parseEvents(text, currentYear);
        expect(parsed).toEqual({
            '2024-0-1': ['New Year'],
            '2024-1-14': ["Valentine's Day"],
        });
    });
});

describe('sampleHolidays', () => {
    it('should return a string of sample holidays for the given year', () => {
        const year = 2024; // A leap year, so Easter dates will be consistent
        const holidays = sampleHolidays(year);

        expect(holidays).toContain('Jan 1: New Year');
        expect(holidays).toContain("Feb 14: Valentine's Day");
        expect(holidays).toContain("Mar 17: St. Patrick's Day");
        expect(holidays).toContain("Apr 1: April Fool's Day");
        // Easter dates for 2024: Maundy Thursday (Mar 28), Good Friday (Mar 29)
        expect(holidays).toContain('Mar 28: Maundy Thursday');
        expect(holidays).toContain('Mar 29: Good Friday');
        expect(holidays).toContain('Oct 31: Halloween');
        expect(holidays).toContain('Dec 24: Christmas Eve');
        expect(holidays).toContain('Dec 25: Christmas*');
        expect(holidays).toContain("Dec 31: New Year's Eve");
    });

    it('should generate correct Easter dates for a different year (non-leap)', () => {
        const year = 2023; // Easter dates for 2023: Maundy Thursday (Apr 6), Good Friday (Apr 7)
        const holidays = sampleHolidays(year);

        expect(holidays).toContain('Apr 6: Maundy Thursday');
        expect(holidays).toContain('Apr 7: Good Friday');
    });

    it('should include special markers in event names', () => {
        const year = 2024;
        const holidays = sampleHolidays(year);
        expect(holidays).toContain("Valentine's Day [heart]");
        expect(holidays).toContain('Christmas*');
    });
});
