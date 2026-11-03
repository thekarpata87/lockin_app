/** "08:00" → "8:00" */
export const shortTime = (hhmm: string) => hhmm.replace(/^0(\d)/, '$1')
