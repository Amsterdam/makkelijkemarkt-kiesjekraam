import { Button, Input, Popover, Skeleton } from 'antd'
import { DeleteOutlined, BgColorsOutlined } from '@ant-design/icons'
import React, { CSSProperties, Dispatch } from 'react'
import { ChromePicker } from 'react-color'

import { Branche, IApiError, IBrancheAction, IBranchePayload } from '../models'
import { useDeleteGenericBranche, useUpdateGenericBranche } from '../hooks'
import { SaveButton } from './buttons'
import { getTextColor } from '../common/generic'
import { networkErrorNotification } from '../common/notifications'

const getStyle = (color: string): CSSProperties => {
  color = `#${color}`
  return {
    background: color || '#fff',
    color: getTextColor(color) || '#000',
  }
}

interface Props extends Branche {
  dispatch: Dispatch<IBrancheAction>
  isLoading?: boolean
  hasChanged?: boolean
}

const GenericBranche: React.VFC<Props> = ({
  id,
  afkorting,
  omschrijving,
  color,
  dispatch,
  isLoading,
  hasChanged = false,
}) => {
  const style = getStyle(color)
  const { mutateAsync: updateGenericBranche, isLoading: updateInProgress } = useUpdateGenericBranche(id)
  const { mutateAsync: deleteGenericBranche, isLoading: deleteInProgress } = useDeleteGenericBranche(id)

  const save = async () => {
    try {
      const response = await updateGenericBranche({ id, afkorting, omschrijving, color })
      const payload: IBranchePayload = { id, newItem: response }
      dispatch({ type: 'REPLACE_ITEM', payload })
    } catch (error: any) {
      networkErrorNotification(error as IApiError)
    }
  }

  const apiDelete = async () => {
    try {
      await deleteGenericBranche()
      const payload: IBranchePayload = { id }
      dispatch({ type: 'DELETE_ITEM', payload })
    } catch (error: any) {
      networkErrorNotification(error as IApiError)
    }
  }

  return (
    <tr>
      <td style={style}>
        <Popover
          content={
            <ChromePicker
              color={color}
              disableAlpha={true}
              onChange={(color: { hex: string }) => {
                const payload: IBranchePayload = { id, key: 'color', value: color.hex.replace(/^#/, '') }
                dispatch({ type: 'UPDATE_ITEM_PROPERTY', payload })
              }}
            />
          }
          trigger="click"
        >
          {isLoading ? (
            <Skeleton.Button active style={{ width: 32 }} />
          ) : (
            <Button title="Kleur veranderen" icon={<BgColorsOutlined />} />
          )}
        </Popover>
      </td>

      <td>
        <Input
          value={afkorting}
          placeholder={'ID-Naam'}
          onChange={(e) => {
            const payload: IBranchePayload = { id, key: 'afkorting', value: e.target.value }
            dispatch({ type: 'UPDATE_ITEM_PROPERTY', payload })
          }}
        />
      </td>

      <td>
        <Input
          value={omschrijving}
          placeholder={'Omschrijving'}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const payload: IBranchePayload = { id, key: 'omschrijving', value: e.target.value }
            dispatch({ type: 'UPDATE_ITEM_PROPERTY', payload })
          }}
        />
      </td>

      <td>
        {isLoading ? (
          <Skeleton.Button active style={{ width: 32 }} />
        ) : (
          <Button
            title="Branche verwijderen"
            icon={<DeleteOutlined />}
            onClick={apiDelete}
            loading={deleteInProgress}
          />
        )}
      </td>

      <td>
        {hasChanged ? (
          <SaveButton clickHandler={save} inProgress={updateInProgress}>
            Opslaan
          </SaveButton>
        ) : null}
      </td>
    </tr>
  )
}

export default React.memo(GenericBranche)
