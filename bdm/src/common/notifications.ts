import { notification } from 'antd'
import { IApiError } from '../models'

export const networkErrorNotification = (error: IApiError) => {
  notification.error({
    message: `Wijzigingen niet opgeslagen`,
    description: `${error.status} ${error.statusText} ${error.message}`,
    duration: 0,
  })
}
