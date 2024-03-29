import React, { Reducer, useContext, useEffect, useState } from 'react'
import { useAllocationDetail } from '../hooks'
import { useParams } from 'react-router-dom'

const AllocationTraceLogPage = (props) => {
  const { allocationDetailId } = useParams()
  const detailCall = useAllocationDetail(allocationDetailId)

  const logData = detailCall.data ? detailCall.data.log : []
  const log = logData.map((line, index) => <div key={index}>{JSON.stringify(line)}</div>)

  return (
    <div>
      <h2>AllocationTraceLogPage</h2>
      {log}
    </div>
  )
}

export default AllocationTraceLogPage
