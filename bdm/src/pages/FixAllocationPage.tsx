import { Button, Col, notification, PageHeader, Row, Select, Tag } from 'antd'
import React, { useContext, useEffect, useState } from 'react'
import { get, groupBy, head, isEmpty, sortBy } from 'lodash'

import { IAllocation } from '../models'
import {
  useAllocation,
  useMarkt,
  useMarktConfig,
  usePlaatsvoorkeur,
  useSaveAllocation,
  useSollicitaties,
} from '../hooks'
import { SaveButton } from '../components/buttons'
import { networkErrorNotification } from '../common/notifications'
import { useParams } from 'react-router-dom'

const { Option } = Select

const EVI = 'eigen-materieel'

// This must be the exact reverse mapping as the rejectReasons in MakkelijkeMarkt API AllocationController
const REJECT_REASON_CODES: { [key: string]: number } = {
  BRANCHE_FULL: 1,
  ADJACENT_UNAVAILABLE: 2,
  MINIMUM_UNAVAILABLE: 3,
  MARKET_FULL: 4,
  VPL_POSITION_NOT_AVAILABLE: 5,
  PREF_NOT_AVAILABLE: 6,
}

type LocatieType = { plaatsId: string }
type updateAllocationType = (kraam: string, ondernemer: string, previous: string) => void
type AllocationContextType = {
  updateAllocation: updateAllocationType
  ondernemersOptionList: JSX.Element[]
  locaties: LocatieType[]
}
const AllocationContext = React.createContext<Partial<AllocationContextType>>({})

const FixAllocationPage: React.VFC = () => {
  const { marktId, marktDate } = useParams<{ marktId: string; marktDate: string }>()
  const weekday = new Date(marktDate).toLocaleDateString('nl-NL', { weekday: 'long' })

  const [allocation, setAllocation] = useState<IAllocation[]>([])
  const allocationCall = useAllocation(marktId, marktDate)
  const {
    mutate: saveAllocationCall,
    isLoading: saveInProgress,
    isSuccess: saveIsSuccess,
    isError: saveIsError,
    error: saveError,
  } = useSaveAllocation(marktId, marktDate)
  const sollicitatiesCall = useSollicitaties(marktId)
  const plaatsvoorkeurCall = usePlaatsvoorkeur(marktId)
  const marktConfigCall = useMarktConfig(marktId)
  const marktCall = useMarkt(marktId)

  const locaties = sortBy((marktConfigCall.data?.locaties as LocatieType[]) || [], [
    (locatie) => Number(locatie.plaatsId),
  ])
  const ondernemers = (sollicitatiesCall.data || []).map((sollicitatie) => {
    return sollicitatie.sollicitatieNummer
  })

  const kraamToOndernemer = allocation.reduce((total: { [key: string]: string }, current) => {
    if (current.isAllocated) {
      current.plaatsen.forEach((plaats: string) => {
        total[plaats] = current.ondernemer.sollicitatieNummer
      })
    }
    return total
  }, {})

  const orgPlaatsenCountPerOndernemer = (allocationCall.data || []).reduce(
    (total: { [key: string]: number }, current) => {
      total[current.koopman] = current.plaatsen ? current.plaatsen.length : 0
      return total
    },
    {}
  )

  const deltaPlaatsenPerOndernemer = allocation.reduce((total: { [key: string]: number }, current) => {
    const nPlaatsen = current.plaatsen ? current.plaatsen.length : 0
    const delta = nPlaatsen - orgPlaatsenCountPerOndernemer[current.erkenningsNummer]
    if (delta) {
      total[current.ondernemer.sollicitatieNummer] = delta
    }
    return total
  }, {})

  const ondernemersOptionList = ondernemers.map((ondernemer) => (
    <Option key={ondernemer} value={ondernemer}>
      {ondernemer}
    </Option>
  ))

  const updateAllocation: updateAllocationType = (kraam, ondernemer, previous) => {
    const updatedAllocation = allocation.map((alloc) => {
      if (alloc.ondernemer.sollicitatieNummer === ondernemer) {
        return {
          ...alloc,
          plaatsen: [...alloc.plaatsen, kraam],
        }
      }
      if (alloc.ondernemer.sollicitatieNummer === previous) {
        return {
          ...alloc,
          plaatsen: alloc.plaatsen.filter((plaats) => plaats !== kraam),
        }
      }
      return alloc
    })
    setAllocation(updatedAllocation)
  }

  const save = () => {
    const allocationsWithPlaatsen = allocation.filter((alloc) => {
      if (alloc.isAllocated && !alloc.plaatsen.length) {
        return false
      }
      return true
    })
    const { true: toewijzingen, false: afwijzingen } = groupBy(allocationsWithPlaatsen, 'isAllocated')
    saveAllocationCall({ toewijzingen, afwijzingen })
  }

  useEffect(() => {
    if (allocationCall.data && sollicitatiesCall.data && plaatsvoorkeurCall.data) {
      const sollicitaties = sollicitatiesCall.data.map((sollicitatie) => {
        const { sollicitatieNummer, status, vastePlaatsen: plaatsen } = sollicitatie
        return {
          sollicitatieNummer,
          status,
          plaatsen,
          erkenningsNummer: sollicitatie.koopman.erkenningsnummer,
        }
      })
      const sollicitatiesGroupedByErkenningsNummer = groupBy(sollicitaties, 'erkenningsNummer')
      const plaatsvoorkeurGroupedByKoopman = groupBy(plaatsvoorkeurCall.data, 'koopman')

      const allocationData = allocationCall.data.map((allocationObject) => {
        const {
          markt: marktId,
          date: marktDate,
          koopman: erkenningsNummer,
          isAllocated,
          plaatsen,
          minimum,
          maximum,
          anywhere,
          bakType,
          branche,
          hasInrichting,
          rejectReason,
        } = allocationObject
        const voorkeur = {
          minimum,
          maximum,
          anywhere,
          bakType,
          branches: [branche],
          verkoopinrichting: hasInrichting ? [EVI] : [],
        }
        const plaatsvoorkeuren = get(head(plaatsvoorkeurGroupedByKoopman[erkenningsNummer]), 'plaatsen', [])
        const ondernemer = {
          ...head(sollicitatiesGroupedByErkenningsNummer[erkenningsNummer]),
          plaatsvoorkeuren,
          voorkeur,
        }
        const code = REJECT_REASON_CODES[rejectReason] || 0
        return {
          marktId,
          isAllocated,
          ondernemer,
          plaatsen,
          marktDate,
          erkenningsNummer,
          reason: rejectReason ? { code } : null,
        }
      })

      setAllocation(allocationData as unknown as IAllocation[])
    }
  }, [allocationCall.data, sollicitatiesCall.data, plaatsvoorkeurCall.data])

  useEffect(() => {
    if (saveIsSuccess) {
      notification.success({
        message: 'Opgeslagen',
        description: 'De allocatie is aangepast',
      })
    }
  }, [saveIsSuccess])

  useEffect(() => {
    if (saveIsError) {
      networkErrorNotification(saveError)
    }
  }, [saveIsError, saveError])

  const context: AllocationContextType = { updateAllocation, locaties, ondernemersOptionList }
  const subTitle = `${weekday} ${marktDate}`
  const title = marktCall.data?.naam || `Markt ${marktId}`

  return (
    <AllocationContext.Provider value={context}>
      <Row>
        <Col md={2} lg={4}></Col>
        <Col md={20} lg={16}>
          <div>
            <PageHeader
              title={title}
              subTitle={subTitle}
              extra={[
                <SaveButton key="save" type="primary" clickHandler={save} inProgress={saveInProgress}>
                  Opslaan
                </SaveButton>,
              ]}
            ></PageHeader>
            <div>
              {!isEmpty(deltaPlaatsenPerOndernemer) &&
                Object.entries(deltaPlaatsenPerOndernemer).map(([ondernemer, delta]) => (
                  <Tag key={ondernemer} color={delta > 0 ? '#87d068' : '#f50'}>
                    {ondernemer}: {delta > 0 ? '+' : ''}
                    {delta}
                  </Tag>
                ))}
            </div>
            <table>
              <thead>
                <tr>
                  <th>Kraam</th>
                  <th>Ondernemer</th>
                  <th>Actie</th>
                </tr>
              </thead>
              <tbody>
                <Kramen kraamToOndernemer={kraamToOndernemer} />
              </tbody>
            </table>
          </div>
        </Col>
        <Col md={2} lg={4}></Col>
      </Row>
    </AllocationContext.Provider>
  )
}

type PropTypes = { kraamToOndernemer: { [key: string]: string } }
const Kramen: React.VFC<PropTypes> = ({ kraamToOndernemer }) => {
  const { locaties } = useContext(AllocationContext) as AllocationContextType

  const kramen = locaties.map(({ plaatsId }) => (
    <Kraam key={plaatsId} kraamNumber={plaatsId} ondernemer={kraamToOndernemer[plaatsId]} />
  ))
  return <>{kramen}</>
}

type KraamOndernemerPropsType = {
  kraamNumber: string
  ondernemer: string
}

const Kraam: React.VFC<KraamOndernemerPropsType> = ({ kraamNumber, ondernemer }) => {
  return (
    <tr>
      <td>{kraamNumber}</td>
      <td>
        <OndernemerSelect ondernemer={ondernemer} kraamNumber={kraamNumber} />
      </td>
      <td>{ondernemer && <ClearAllocationButton ondernemer={ondernemer} kraamNumber={kraamNumber} />}</td>
    </tr>
  )
}

const OndernemerSelect: React.VFC<KraamOndernemerPropsType> = ({ ondernemer, kraamNumber }) => {
  const { updateAllocation, ondernemersOptionList } = useContext(AllocationContext) as AllocationContextType

  return (
    <Select
      style={{ width: '15rem' }}
      showSearch
      value={ondernemer}
      placeholder="Kies sollicitatienummer"
      onChange={(newOndernemer) => updateAllocation(kraamNumber, newOndernemer, ondernemer)}
    >
      {ondernemersOptionList}
    </Select>
  )
}

const ClearAllocationButton: React.VFC<KraamOndernemerPropsType> = ({ ondernemer, kraamNumber }) => {
  const { updateAllocation } = useContext(AllocationContext) as AllocationContextType

  return (
    <Button type="link" onClick={() => updateAllocation(kraamNumber, '', ondernemer)}>
      maak deze plaats vrij
    </Button>
  )
}

export default FixAllocationPage
