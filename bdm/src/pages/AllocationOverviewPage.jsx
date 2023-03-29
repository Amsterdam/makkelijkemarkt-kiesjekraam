import React, { Reducer, useContext, useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Button, Collapse, Space, Tag } from 'antd'
import {
  CheckCircleTwoTone,
  ClockCircleOutlined,
  CloseSquareTwoTone,
  CopyOutlined,
  QuestionOutlined,
  UserOutlined,
} from '@ant-design/icons'

import { useAllocationOverview, useAllocationV2 } from '../hooks'

const { Panel } = Collapse

const AllocationOverviewPage = (props) => {
  const { marktId, marktDate } = useParams()
  const allocationOverviewCall = useAllocationOverview(marktId, marktDate)
  console.log(allocationOverviewCall)
  const allocations =
    allocationOverviewCall.data &&
    allocationOverviewCall.data.map((allocation) => <Allocation key={allocation.id} {...allocation} />)

  return (
    <div>
      <h2>AllocationOverviewPage</h2>
      {allocations}
    </div>
  )
}

const Allocation = (props) => {
  const status =
    props.allocationStatus === 0 ? (
      <CheckCircleTwoTone twoToneColor="#52c41a" />
    ) : (
      <CloseSquareTwoTone twoToneColor="#eb2f96" />
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
  const detailCall = useAllocationV2(props.id)
  const inputData = detailCall.data ? JSON.stringify(detailCall.data.input) : ''
  const logPath = `/allocation/${props.id}/trace-log`
  console.log(detailCall.data)
  return (
    <>
      <textarea style={{ backgroundColor: '#FAF9F6' }} value={inputData} readOnly></textarea>
      <Space size="large">
        <Button
          icon={<CopyOutlined />}
          onClick={() => {
            navigator.clipboard.writeText(inputData)
          }}
        >
          Copy to clipboard
        </Button>
        <Link to={logPath}>Bekijk trace log pagina</Link>
      </Space>
    </>
  )
}

/*
{
  "status": "success",
  "isLoading": false,
  "isSuccess": true,
  "isError": false,
  "isIdle": false,
  "data": [
      {
          "id": 6,
          "marktDate": "2023-03-11",
          "markt": {
              "id": 39,
              "afkorting": "AC-2022",
              "naam": "Albert Cuyp-2022",
              "isABlijstIndeling": false
          },
          "email": "kjk_marktmeester@amsterdam.nl",
          "creationDate": "2023-03-07 17:11:46",
          "allocationStatus": 0,
          "allocationType": 2,
          "allocationVersion": "2"
      },
      {
          "id": 20,
          "marktDate": "2023-03-11",
          "markt": {
              "id": 39,
              "afkorting": "AC-2022",
              "naam": "Albert Cuyp-2022",
              "isABlijstIndeling": false
          },
          "email": "scheduled",
          "creationDate": "2023-03-10 11:11:38",
          "allocationStatus": 0,
          "allocationType": 1,
          "allocationVersion": "2"
      },
      {
          "id": 21,
          "marktDate": "2023-03-11",
          "markt": {
              "id": 39,
              "afkorting": "AC-2022",
              "naam": "Albert Cuyp-2022",
              "isABlijstIndeling": false
          },
          "email": "scheduled",
          "creationDate": "2023-03-10 11:17:35",
          "allocationStatus": 0,
          "allocationType": 1,
          "allocationVersion": "2"
      },
      {
          "id": 22,
          "marktDate": "2023-03-11",
          "markt": {
              "id": 39,
              "afkorting": "AC-2022",
              "naam": "Albert Cuyp-2022",
              "isABlijstIndeling": false
          },
          "email": "scheduled",
          "creationDate": "2023-03-10 11:23:20",
          "allocationStatus": 0,
          "allocationType": 1,
          "allocationVersion": "2"
      },
      {
          "id": 23,
          "marktDate": "2023-03-11",
          "markt": {
              "id": 39,
              "afkorting": "AC-2022",
              "naam": "Albert Cuyp-2022",
              "isABlijstIndeling": false
          },
          "email": "scheduled",
          "creationDate": "2023-03-10 11:25:37",
          "allocationStatus": 0,
          "allocationType": 1,
          "allocationVersion": "2"
      }
  ],
  "dataUpdatedAt": 1679576307049,
  "error": null,
  "errorUpdatedAt": 0,
  "failureCount": 0,
  "errorUpdateCount": 0,
  "isFetched": true,
  "isFetchedAfterMount": true,
  "isFetching": false,
  "isRefetching": false,
  "isLoadingError": false,
  "isPlaceholderData": false,
  "isPreviousData": false,
  "isRefetchError": false,
  "isStale": true
}
*/

export default AllocationOverviewPage
