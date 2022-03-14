export const MM_API_BASE_ORIGIN = process.env.REACT_APP_KJK_API_ORIGIN || ''
export const MM_API_BASE_URL = `${MM_API_BASE_ORIGIN}/api`

export const MM_API_QUERY_CONFIG = {
  retry: 1,
  refetchOnWindowFocus: false, //refetch when window comes to focus
}

export const COLOR = {
  WHITE: '#fff',
  BLACK: '#000',
}

const KJK_HOME_LINK = '/markt'
export const HOME_LINK = KJK_HOME_LINK
