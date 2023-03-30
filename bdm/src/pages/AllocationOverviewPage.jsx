import React, { Reducer, useContext, useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { message, Button, Collapse, Space, Tag } from 'antd'
import {
  BulbFilled,
  CheckCircleTwoTone,
  ClockCircleOutlined,
  CloseSquareTwoTone,
  CopyOutlined,
  QuestionOutlined,
  UserOutlined,
} from '@ant-design/icons'

import { useAllocationOverview, useAllocationDetail, useMarkt } from '../hooks'

const { Panel } = Collapse

const AllocationOverviewPage = (props) => {
  const { marktId, marktDate } = useParams()
  const allocationOverviewCall = useAllocationOverview(marktId, marktDate)
  const marktCall = useMarkt(marktId)

  const date = new Date(marktDate).toLocaleDateString('nl-NL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const title = marktCall.data?.naam || `Markt ${marktId}`

  console.log(allocationOverviewCall)
  const allocations =
    allocationOverviewCall.data &&
    allocationOverviewCall.data.map((allocation) => <Allocation key={allocation.id} {...allocation} />)

  return (
    <div>
      <h2>
        Overzicht indelingen {date} op {title}
      </h2>
      {allocations}
    </div>
  )
}

const Allocation = (props) => {
  const status =
    props.allocationStatus === 0 ? (
      <CheckCircleTwoTone twoToneColor="#52c41a" />
    ) : (
      <CloseSquareTwoTone twoToneColor="red" />
    )

  const getAgentIcon = () => {
    switch (props.allocationType) {
      case 1:
        return <ClockCircleOutlined />
      case 2:
        return <UserOutlined />
      default:
        return <QuestionOutlined />
    }
  }

  const header = (
    <Space size="large">
      {status}
      {props.creationDate}
      <Tag color="#108ee9">V{props.allocationVersion}</Tag>
      {getAgentIcon()}
      {props.email}
      {props.allocationType === 2 && <Tag icon={<BulbFilled />}>concept</Tag>}
    </Space>
  )
  return (
    <Collapse>
      <Panel header={header} key={props.id}>
        <AllocationDetail id={props.id} />
      </Panel>
    </Collapse>
  )
}

const AllocationDetail = (props) => {
  const detailCall = useAllocationDetail(props.id)
  const inputData = detailCall.data ? JSON.stringify(detailCall.data.input) : ''
  const logPath = `/allocation/${props.id}/trace-log`
  console.log(detailCall.data)
  return (
    <>
      <h3>Input data van deze indeling</h3>
      <textarea style={{ backgroundColor: '#FAF9F6' }} value={inputData} readOnly></textarea>
      <Space size="large">
        <Button
          icon={<CopyOutlined />}
          onClick={() => {
            navigator.clipboard.writeText(inputData)
            message.info('Gekopieerd')
          }}
        >
          Kopieer
        </Button>
        <Link to={logPath}>Bekijk trace log pagina</Link>
      </Space>
    </>
  )
}

export default AllocationOverviewPage
