export const addDays = (date: Date, days: number): Date => {
  date.setDate(date.getDate() + days)
  return date
}

export const convertDate = (date: Date): string => {
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const yyyy = date.getFullYear()
  return `${yyyy}-${mm}-${dd}`
}

export const getMonday = (date: Date, hour: number): Date => {
  const dateMonday = new Date(date)
  dateMonday.setHours(hour, 0, 0, 0)
  const day = dateMonday.getDay()
  const diff = dateMonday.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(dateMonday.setDate(diff))
}

export const setDate = (date: Date): void => {
  const now = new Date(date)
  cy.clock(now, ['Date'])
}

// export const setDate2 = (year: number, month: number, day: number): void => {
//   const now = new Date(year, month - 1, day)
//   cy.clock(now, ['Date'])
// }
