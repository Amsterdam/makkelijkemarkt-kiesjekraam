import React from 'react'
import { Button } from 'antd'
import { PlusSquareOutlined, SaveFilled } from '@ant-design/icons'

interface BaseButtonProps {
  icon: JSX.Element
  clickHandler(): void
  inProgress?: boolean
  type?: 'text' | 'link' | 'ghost' | 'primary' | 'default' | 'dashed'
}

interface Props extends Omit<BaseButtonProps, 'icon'> {}

const BaseButton: React.FC<BaseButtonProps> = ({
  icon,
  clickHandler,
  children,
  inProgress = false,
  type = 'default',
}) => {
  return (
    <Button type={type} icon={icon} onClick={clickHandler} loading={inProgress}>
      {children}
    </Button>
  )
}

export const SaveButton: React.FC<Props> = (props) => BaseButton({ ...props, icon: <SaveFilled /> })
export const AddButton: React.FC<Props> = (props) => BaseButton({ ...props, icon: <PlusSquareOutlined /> })
