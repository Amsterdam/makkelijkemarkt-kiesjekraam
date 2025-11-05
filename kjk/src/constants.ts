export const MM_API_BASE_ORIGIN = process.env.REACT_APP_KJK_API_ORIGIN || ''
export const MM_API_BASE_URL = `${MM_API_BASE_ORIGIN}/api`

export const DAALDER_API_BASE_ORIGIN = process.env.REACT_APP_KJK_API_ORIGIN || ''
export const DAALDER_API_BASE_URL = `${DAALDER_API_BASE_ORIGIN}/daalder`

export const MM_API_QUERY_CONFIG = {
  retry: 1,
  refetchOnWindowFocus: false, //refetch when window comes to focus
}

export const DAALDER_API_QUERY_CONFIG = {
  retry: 0,
  refetchOnWindowFocus: false, //refetch when window comes to focus
}

export const COLOR = {
  WHITE: '#fff',
  BLACK: '#000',
}

export const MARKTMEESTER_HOME_LINK = '/markt/'
export const ONDERNEMER_HOME_LINK = '/dashboard/'

export const VASTE_PLAATS_HOUDER_STATUS = [
  'vpl',
  'eb',
  'exp',
  'expf',
  'tvpl',
  'tvplz', // all ondernemers from Mercato
]
