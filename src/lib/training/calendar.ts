import type { TrainingProfile } from "./types";

const pad = (value: number) => String(value).padStart(2, "0");
const escapeCalendar = (value: string) => value.replaceAll("\\", "\\\\").replaceAll("\n", "\\n").replaceAll(",", "\\,").replaceAll(";", "\\;");

export function trainingCalendar(profile: TrainingProfile, title: string, description: string): string {
  const date = new Date();
  const [hours, minutes] = profile.time.split(":").map(Number);
  date.setHours(hours, minutes, 0, 0);
  for (let offset = 0; offset < 8; offset++) {
    if (profile.weekdays.includes(date.getDay()) && date.getTime() > Date.now()) break;
    date.setDate(date.getDate() + 1);
  }
  const localStart = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(hours)}${pad(minutes)}00`;
  const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const days = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Eureka//Fit Workout Schedule//EN", "CALSCALE:GREGORIAN", "BEGIN:VEVENT", `UID:${Date.now()}-workout@eureka.local`, `DTSTAMP:${timestamp}`, `DTSTART:${localStart}`, "DURATION:PT45M", `RRULE:FREQ=WEEKLY;BYDAY=${profile.weekdays.map(day => days[day]).join(",")}`, `SUMMARY:${escapeCalendar(title)}`, `DESCRIPTION:${escapeCalendar(description)}`, "BEGIN:VALARM", "TRIGGER:-PT15M", "ACTION:DISPLAY", `DESCRIPTION:${escapeCalendar(title)}`, "END:VALARM", "END:VEVENT", "END:VCALENDAR"];
  // iCalendar content lines fold at 75 octets, including non-ASCII localized text.
  return lines.map(line => {
    let folded = "";
    let octets = 0;
    for (const char of line) {
      const size = new TextEncoder().encode(char).length;
      if (octets + size > 75) { folded += "\r\n "; octets = 1; }
      folded += char; octets += size;
    }
    return folded;
  }).join("\r\n") + "\r\n";
}
