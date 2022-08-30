import { notification } from 'antd'
import { IApiError } from '../models'

export const networkErrorNotification = (error: IApiError) => {
  notification.error({
    message: `Netwerk fout ${error.status} ${error.message}`,
    description: 'Wijzigingen zijn niet opgeslagen',
    duration: 0,
  })
}
