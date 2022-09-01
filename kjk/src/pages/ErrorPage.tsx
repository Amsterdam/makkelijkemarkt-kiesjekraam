import { Alert, Button } from 'antd'
import React from 'react'
import { useHistory } from 'react-router-dom'

const ErrorPage = () => {
  const history = useHistory()
  return (
    <Alert
      message="Error"
      showIcon
      description="De gevraagde actie kon niet uitgevoerd worden"
      type="error"
      action={
        <Button size="large" onClick={history.goBack}>
          Vorige pagina
        </Button>
      }
    />
  )
}

export default ErrorPage
