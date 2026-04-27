export function todayInShanghai() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  return formatter.format(new Date());
}

export function startOfWeek(date = todayInShanghai()) {
  const d = new Date(`${date}T00:00:00+08:00`);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  return d.toISOString().slice(0, 10);
}

export function makeRecordKey(userId: string, date: string) {
  return `${userId}_${date}`;
}
