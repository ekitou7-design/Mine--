import { CalendarEvent } from '../types';

const unfoldIcsLines = (text: string): string[] => (
  text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .reduce<string[]>((lines, line) => {
      if (/^[ \t]/.test(line) && lines.length > 0) {
        lines[lines.length - 1] += line.slice(1);
      } else {
        lines.push(line);
      }
      return lines;
    }, [])
);

const unescapeIcsText = (value: string): string => (
  value
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
);

const parseDateValue = (value: string): string => {
  const datePart = value.includes('T') ? value.split('T')[0] : value;
  return `${datePart.slice(0, 4)}-${datePart.slice(4, 6)}-${datePart.slice(6, 8)}`;
};

const getProperty = (lines: string[], name: string): string | undefined => {
  const line = lines.find((entry) => entry.startsWith(`${name}:`) || entry.startsWith(`${name};`));
  if (!line) return undefined;
  return line.slice(line.indexOf(':') + 1).trim();
};

export const parseIcsCalendarEvents = (icsText: string, source = 'ICS Import'): Record<string, CalendarEvent[]> => {
  const lines = unfoldIcsLines(icsText);
  const eventsByDate: Record<string, CalendarEvent[]> = {};
  let currentEventLines: string[] | null = null;

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      currentEventLines = [];
      continue;
    }

    if (line === 'END:VEVENT') {
      if (currentEventLines) {
        const title = unescapeIcsText(getProperty(currentEventLines, 'SUMMARY') || '');
        const dtStart = getProperty(currentEventLines, 'DTSTART');
        const dtEnd = getProperty(currentEventLines, 'DTEND');
        const uid = getProperty(currentEventLines, 'UID');

        if (title && dtStart) {
          const date = parseDateValue(dtStart);
          const event: CalendarEvent = {
            id: uid || `ics_${date}_${title}`.replace(/\s+/g, '_'),
            title,
            date,
            endDate: dtEnd ? parseDateValue(dtEnd) : undefined,
            type: 'event',
            source,
            allDay: true,
          };

          eventsByDate[date] = [...(eventsByDate[date] || []), event];
        }
      }
      currentEventLines = null;
      continue;
    }

    if (currentEventLines) {
      currentEventLines.push(line);
    }
  }

  // TODO: Expand RRULE recurring events in a later version.
  return eventsByDate;
};

export const mergeCalendarEvents = (
  existing: Record<string, CalendarEvent[]>,
  incoming: Record<string, CalendarEvent[]>
): Record<string, CalendarEvent[]> => {
  const merged = { ...existing };

  Object.entries(incoming).forEach(([dateKey, events]) => {
    const current = merged[dateKey] || [];
    const next = [...current];

    events.forEach((event) => {
      const duplicate = next.some((item) => (
        item.id === event.id ||
        (item.title === event.title && item.date === event.date && item.source === event.source)
      ));
      if (!duplicate) next.push(event);
    });

    merged[dateKey] = next;
  });

  return merged;
};
