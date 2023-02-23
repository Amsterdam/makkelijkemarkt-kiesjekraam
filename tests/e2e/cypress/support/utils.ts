/**
 * Function to add days to a given date, returns result.
 * @example addDays(getMonday(new Date(), 0)
 * @param {Date} date - the start date.
 * @param {number} days - days to add to start date.
 */
export const addDays = (date: Date, days: number): Date => {
  date.setDate(date.getDate() + days)
  return date
}

/**
 * Function to assert if all links (except logout) on a page are working by sending a request. Fails if no 200.
 * @param {'marktmeester'} role - if role is marktmeester, the assert skips a link to edit a market.
 * @example assertAllLinksOnPage()
 */
export const assertAllLinksOnPage = (role?: 'marktmeester'): void => {
  cy.get("a:not([href*='logout'])").each(page => {
    if (page[0].getAttribute('href') === '/bdm/markt/39' && role === 'marktmeester') {
      console.log('this link is not working')
    } else {
      cy.request(page.prop('href'))
    }
  })
}

/**
 * Function to convert a date to a string of type 'yyyymmdd' or 'ddmmyyyy'.
 * @example convertDate(addDays(new Date(), 34)
 * @param {Date} date - date to convert.
 * @param {'yyyymmdd' | 'ddmmyyyy'} type - type to convert to.
 */
export const convertDate = (date: Date, type: 'yyyymmdd' | 'ddmmyyyy'): string => {
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const yyyy = date.getFullYear()
  if (type === 'yyyymmdd') {
    return `${yyyy}-${mm}-${dd}`
  } else {
    return `${dd}-${mm}-${yyyy}`
  }
}

/**
 * Function to get the monday of the week for the given date.
 * @example getMonday(new Date(), 0)
 * @param {Date} date - a date.
 * @param {number} hour - output type after conversion.
 */
export const getMonday = (date: Date, hour: number): Date => {
  const dateMonday = new Date(date)
  dateMonday.setHours(hour, 0, 0, 0)
  const day = dateMonday.getDay()
  const diff = dateMonday.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(dateMonday.setDate(diff))
}

/**
 * Function to change the systemdate to a certain date.
 * @example setDate(getMonday(new Date(), 0))
 * @param {Date} date - date
 */
export const setDate = (date: Date): void => {
  const now = new Date(date)
  cy.clock(now, ['Date'])
}
