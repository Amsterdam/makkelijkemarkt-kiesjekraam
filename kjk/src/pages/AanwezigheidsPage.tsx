import { Alert, Card, Checkbox, Col, notification, PageHeader, Row, Space, Tag, Tooltip, Typography } from 'antd'
import { CheckboxChangeEvent } from 'antd/lib/checkbox'
import { ArrowLeftOutlined, UserOutlined, WarningOutlined } from '@ant-design/icons'
import { every, find, get, groupBy, includes, isEmpty } from 'lodash'
import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'

import { SaveButton } from '../components/buttons'
import {
  ErkenningsNummer,
  IAanwezigheidsPageRouteParams,
  IMarktVoorkeur,
  IOndernemer,
  IRsvp,
  IRsvpPattern,
  ISollicitatie,
} from '../models'
import { RoleContext } from '../components/providers/RoleProvider'
import {
  useMarkt,
  useMarktVoorkeur,
  useOndernemer,
  useRsvp,
  useSaveRsvp,
  useRsvpPattern,
  useSaveRsvpPattern,
} from '../hooks'

const { Link } = Typography

const CUTOFF_TIME = '15:00:00'
const EMPTY_BRANCH = '000-EMPTY'

const WEEKDAY_NAME_MAP = {
  monday: 'ma',
  tuesday: 'di',
  wednesday: 'wo',
  thursday: 'do',
  friday: 'vr',
  saturday: 'za',
  sunday: 'zo',
}

interface IRsvpExt extends Omit<IRsvp, 'koopmanErkenningsNummer' | 'marktId'> {
  koopman: ErkenningsNummer
  markt: string
  day: string
  shortName: string
  isInThePast: boolean
}

interface IRsvpPatternExt extends Omit<IRsvpPattern, 'erkenningsNummer' | 'markt'> {}

type PatternFunctionType = (patternDay: string, attending: boolean) => void
type UpdateRsvpFunctionType = (updatedRsvp: IRsvpExt) => void
type saveFunctionType = (id: string) => void

const AanwezigheidsPage: React.VFC = () => {
  const { erkenningsNummer, marktId } = useParams<IAanwezigheidsPageRouteParams>()
  const ondernemerData = useOndernemer(erkenningsNummer)
  const rsvpData = useRsvp(erkenningsNummer)
  const rsvpPatternData = useRsvpPattern(erkenningsNummer)
  const marktVoorkeurData = useMarktVoorkeur(erkenningsNummer)
  const marktData = useMarkt(marktId)

  // console.log(marktData.data)

  const { mutate: saveRsvpApi, isLoading: saveRsvpApiInProgress, isSuccess: saveRsvpIsSuccess } = useSaveRsvp()
  const {
    mutate: savePatternApi,
    isLoading: savePatternApiInProgress,
    isSuccess: savePatternIsSuccess,
    isError: savePatternIsError,
  } = useSaveRsvpPattern()

  const [sollicitatie, setSollicitatie] = useState<Partial<ISollicitatie>>({})
  const [rsvps, setRsvps] = useState<IRsvpExt[]>([])
  const [pattern, setPattern] = useState<Partial<IRsvpPatternExt>>({})

  // console.log('PATTERN', pattern)

  const updateRsvp: UpdateRsvpFunctionType = (updatedRsvp) => {
    const updatedRsvps = rsvps.map((rsvp) => {
      if (rsvp.marktDate === updatedRsvp.marktDate) {
        return updatedRsvp
      }
      return rsvp
    })
    setRsvps(updatedRsvps)
  }

  const updatePattern: PatternFunctionType = (patternDay, attending) => {
    setPattern({
      ...pattern,
      [patternDay]: attending,
    })
    syncRsvpsWithUpdatedPatternDay(patternDay, attending)
  }

  const syncRsvpsWithUpdatedPatternDay: PatternFunctionType = (patternDay, attending) => {
    const syncedRsvps = rsvps.map((rsvp) => {
      if (rsvp.day === patternDay && !rsvp.isInThePast) {
        return {
          ...rsvp,
          attending,
        }
      }
      return rsvp
    })
    setRsvps(syncedRsvps)
  }

  const save = async () => {
    await saveRsvps()
    await savePattern()
  }

  const saveRsvps = async () => {
    rsvps
      .filter((rsvp) => rsvp.markt === marktId)
      .forEach((rsvp) => {
        saveRsvpApi({
          ...rsvp,
          koopmanErkenningsNummer: rsvp.koopman,
          marktId,
        })
      })
  }

  const savePattern = async () => {
    const patternData = {
      ...pattern,
      erkenningsNummer,
      markt: marktId,
    }
    savePatternApi(patternData as IRsvpPattern)
  }

  useEffect(() => {
    if (savePatternIsSuccess) {
      notification.success({
        message: 'Opgeslagen',
        description: 'Uw aanwezigheidsvoorkeuren zijn opgeslagen',
      })
    }
  }, [savePatternIsSuccess])

  useEffect(() => {
    if (savePatternIsError) {
      notification.error({
        message: 'Fout tijdens opslaan',
        description: 'Uw aanwezigheidsvoorkeuren zijn niet opgeslagen',
      })
    }
  }, [savePatternIsError])

  useEffect(() => {
    const allDataLoaded = every(
      [ondernemerData, marktData, rsvpPatternData, rsvpData],
      (apiCall) => apiCall.data !== undefined
    )
    console.log('useEffect', { allDataLoaded })

    if (allDataLoaded) {
      console.log('allDataLoaded')
      // MARKT
      const { marktDagen = [] } = marktData.data || {}
      console.log(marktDagen)

      // ONDERNEMER
      const sollicitatie: Partial<ISollicitatie> =
        find(ondernemerData.data?.sollicitaties, (s) => String(s.markt.id) === marktId) || {}
      setSollicitatie(sollicitatie)
      console.log(sollicitatie)
      const isStatusLikeVpl = sollicitatie.status === 'vpl' || sollicitatie.status === 'eb'

      // PATTERN
      let pattern: Partial<IRsvpPatternExt> = {}
      const patternFromApi: IRsvpPattern | undefined = find(rsvpPatternData.data, (p) => p.markt === marktId)
      if (!patternFromApi) {
        console.log('SET INITIAL PATTERN')
        Object.keys(WEEKDAY_NAME_MAP).forEach((day) => {
          pattern[day as keyof IRsvpPatternExt] =
            isStatusLikeVpl && includes(marktDagen, WEEKDAY_NAME_MAP[day as keyof IRsvpPatternExt])
        })
      } else {
        const { monday, tuesday, wednesday, thursday, friday, saturday, sunday } = patternFromApi
        pattern = { monday, tuesday, wednesday, thursday, friday, saturday, sunday }
      }
      console.log(pattern)
      setPattern(pattern)

      // RSVPS
      const setInitialRsvps = () => {
        const today = new Date()
        const mondayDelta = 1 - today.getDay()
        const initialRsvps = new Array(14).fill(null).map((_, index) => {
          const date = new Date()
          date.setDate(date.getDate() + index + mondayDelta)
          const day = date.getDate()
          const month = date.getMonth() + 1
          const year = date.getFullYear()
          const marktDate = `${year}-${(month > 9 ? '' : '0') + month}-${(day > 9 ? '' : '0') + day}`
          const shortName = date.toLocaleDateString('nl-NL', { weekday: 'short' })
          return {
            marktDate,
            shortName,
            koopman: erkenningsNummer,
            markt: marktId,
            attending: isStatusLikeVpl && includes(marktDagen, shortName),
            day: date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(),
            isInThePast: new Date(`${marktDate}T${CUTOFF_TIME}`) < today,
          }
        })
        return initialRsvps
      }

      const mergeRsvps = (initialRsvps: IRsvpExt[]) => {
        return initialRsvps.map((initialRsvp: IRsvpExt) => {
          const incomingRsvp = find(rsvpData.data, { marktDate: initialRsvp.marktDate, markt: initialRsvp.markt }) || {}
          const mergedRsvp = {
            ...initialRsvp,
            ...incomingRsvp,
          }
          return mergedRsvp
        })
      }

      const initialRsvps = setInitialRsvps()
      const mergedRsvps = mergeRsvps(initialRsvps)
      console.log({ initialRsvps, mergedRsvps })
      setRsvps(mergedRsvps)
    }
  }, [erkenningsNummer, marktId, ondernemerData.data, rsvpPatternData.data, rsvpData.data])

  // useEffect(() => {
  //   const setInitialRsvps = () => {
  //     const today = new Date()
  //     const mondayDelta = 1 - today.getDay()
  //     const initialRsvps = new Array(14).fill(null).map((_, index) => {
  //       const date = new Date()
  //       date.setDate(date.getDate() + index + mondayDelta)
  //       const day = date.getDate()
  //       const month = date.getMonth() + 1
  //       const year = date.getFullYear()
  //       const marktDate = `${year}-${(month > 9 ? '' : '0') + month}-${(day > 9 ? '' : '0') + day}`
  //       return {
  //         marktDate,
  //         koopman: erkenningsNummer,
  //         markt: marktId,
  //         attending: false,
  //         day: date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(),
  //         shortName: date.toLocaleDateString('nl-NL', { weekday: 'short' }),
  //         isInThePast: new Date(`${marktDate}T${CUTOFF_TIME}`) < today,
  //       }
  //     })
  //     setRsvps(initialRsvps)
  //   }

  //   setPattern(INITIAL_PATTERN)
  //   setInitialRsvps()
  // }, [])

  // useEffect(() => {
  //   if (rsvpPatternData.data?.length) {
  //     const pattern: Partial<IRsvpPattern> = find(rsvpPatternData.data, (p) => p.markt === marktId) || {}
  //     const { monday, tuesday, wednesday, thursday, friday, saturday, sunday } = pattern
  //     setPattern({ monday, tuesday, wednesday, thursday, friday, saturday, sunday })
  //   }
  // }, [rsvpPatternData.data, marktId])

  // useEffect(() => {
  //   if (rsvpData.data?.length) {
  //     const updatedRsvps = rsvps.map((rsvp) => {
  //       const incomingRsvp = find(rsvpData.data, { marktDate: rsvp.marktDate, markt: rsvp.markt }) || {}
  //       const mergedRsvp = {
  //         ...rsvp,
  //         ...incomingRsvp,
  //       }
  //       return mergedRsvp
  //     })
  //     setRsvps(updatedRsvps)
  //   }
  // }, [rsvpData.data])

  // useEffect(() => {
  //   if (ondernemerData.data) {
  //     const sollicitatie: Partial<ISollicitatie> =
  //       find(ondernemerData.data.sollicitaties, (s) => String(s.markt.id) === marktId) || {}
  //     setSollicitatie(sollicitatie)
  //   }
  // }, [ondernemerData.data])

  const rsvpPerMarkt = groupBy(rsvps, 'markt')
  const marktVoorkeur: Partial<IMarktVoorkeur> = find(marktVoorkeurData.data || [], { markt: marktId }) || {}
  const hasValidBranche =
    !marktVoorkeurData.data ||
    (!isEmpty(marktVoorkeur) && marktVoorkeur.branche && marktVoorkeur.branche !== EMPTY_BRANCH)

  const marktComponent = (
    <Markt
      key={marktId}
      id={marktId}
      name={sollicitatie.markt?.naam}
      sollicitatieNummer={sollicitatie.sollicitatieNummer}
      sollicitatieStatus={sollicitatie.status}
      rsvps={rsvpPerMarkt[marktId]}
      updateRsvp={updateRsvp}
      pattern={pattern as IRsvpPatternExt}
      updatePattern={updatePattern}
      save={save}
      apiInProgress={saveRsvpApiInProgress || savePatternApiInProgress}
    />
  )

  return (
    <div style={{ paddingBottom: '2rem' }}>
      <Row>
        <Col md={2} lg={4}></Col>
        <Col md={20} lg={16}>
          <div className="flex-center">
            <Space direction="vertical" size="large">
              {<Ondernemer {...ondernemerData.data} />}
              <Messages showMissingBrancheWarning={!hasValidBranche} marktData={marktData.data} />
              {hasValidBranche && marktComponent}
            </Space>
          </div>
        </Col>
        <Col md={2} lg={4}></Col>
      </Row>
    </div>
  )
}

const Ondernemer: React.VFC<Partial<IOndernemer>> = (props) => {
  const title = `${props.achternaam || ''} ${props.voorletters || ''}`
  const avatar = { icon: <UserOutlined /> }
  const backButton = <BackButton />
  const subTitle = `registratienummer ${props.erkenningsnummer || ''}`
  return <PageHeader title={title} subTitle={subTitle} avatar={avatar} extra={backButton}></PageHeader>
}

type MarktPropsType = {
  id: string
  name?: string
  sollicitatieStatus?: string
  sollicitatieNummer?: number
  apiInProgress: boolean
  rsvps: IRsvpExt[]
  pattern: IRsvpPatternExt
  save: saveFunctionType
  updateRsvp: UpdateRsvpFunctionType
  updatePattern: PatternFunctionType
}
const Markt: React.VFC<MarktPropsType> = (props) => {
  const extra = [
    <Tag key="sollicitatieStatus" color="#00A03C">
      {props.sollicitatieStatus}
    </Tag>,
    <Tag key="sollicitatieNummer" color="#000000">
      {props.sollicitatieNummer}
    </Tag>,
    <SaveButton key="save" clickHandler={() => props.save(props.id)} inProgress={props.apiInProgress}>
      Opslaan
    </SaveButton>,
  ]
  return (
    <Card title={props.name} extra={extra}>
      <Space direction="vertical" size="large">
        <Space size={[64, 16]} wrap>
          {props.rsvps && <RsvpList title="Deze week" rsvps={props.rsvps.slice(0, 7)} updateRsvp={props.updateRsvp} />}
          {props.rsvps && <RsvpList title="Volgende week" rsvps={props.rsvps.slice(7)} updateRsvp={props.updateRsvp} />}
        </Space>
        <Pattern markt={props.id} pattern={props.pattern} updatePattern={props.updatePattern} rsvps={props.rsvps} />
      </Space>
    </Card>
  )
}

const Messages: React.VFC<{ showMissingBrancheWarning: boolean; marktData: any }> = (props) => {
  const { erkenningsNummer, marktId } = useParams<IAanwezigheidsPageRouteParams>()
  const mandatoryPresenceWarning = (
    <>
      <p>Een aangevinkte dag betekent dat u (of uw vervanger) aanwezig zal zijn.</p>
      <p style={{ fontStyle: 'italic' }}>
        Bent u er niet? Dan brengen wij het marktgeld de volgende keer dat u op de markt bent in rekening. Indien u niet
        aan uw betaalverplichting voldoet, zijn wij genoodzaakt uw vergunning in te trekken totdat u heeft betaald.
      </p>
    </>
  )

  const marktProfielUrl = `/ondernemer/${erkenningsNummer}/algemene-voorkeuren/${marktId}/`
  const missingBrancheWarning = (
    <p>
      U hebt uw koopwaar nog niet doorgegeven in het <Link href={marktProfielUrl}>marktprofiel</Link>, daarom kunt u
      zich niet aanmelden voor deze markt
    </p>
  )

  return (
    <Space direction="vertical" size="large">
      {props.showMissingBrancheWarning && (
        <Alert
          icon={<WarningOutlined />}
          message={<h3>Profiel niet compleet</h3>}
          description={missingBrancheWarning}
          type="error"
          showIcon
          closable
        />
      )}
      {props.showMissingBrancheWarning || (
        <Alert
          icon={<WarningOutlined />}
          message={<h3>Digitaal ingedeeld? Dan ook komen!</h3>}
          description={mandatoryPresenceWarning}
          type="warning"
          showIcon
          closable
        />
      )}
      {props.marktData?.kiesJeKraamMededelingTekst && (
        <Alert
          message={<h3>{props.marktData.kiesJeKraamMededelingTitel}</h3>}
          description={props.marktData.kiesJeKraamMededelingTekst}
          type="info"
          showIcon
          closable
        />
      )}
    </Space>
  )
}

type PatternPropsType = {
  markt: string
  pattern: IRsvpPatternExt
  updatePattern: PatternFunctionType
  rsvps: IRsvpExt[]
}
const Pattern: React.VFC<PatternPropsType> = (props) => {
  const updatePattern = (event: CheckboxChangeEvent) => {
    const attending = event.target.checked
    const patternDay = event.target.value
    props.updatePattern(patternDay, attending)
  }

  const renderedPattern = Object.keys(props.pattern).map((item) => {
    const name = get(find(props.rsvps, { day: item }), 'shortName')
    return (
      <DayUI
        key={item}
        onChange={updatePattern}
        checked={props.pattern[item as keyof IRsvpPatternExt]}
        value={item}
        name={name}
      ></DayUI>
    )
  })
  return <WeekUI title="Aanwezigheidspatroon">{renderedPattern}</WeekUI>
}

const RsvpList: React.VFC<{ rsvps: IRsvpExt[]; updateRsvp: UpdateRsvpFunctionType; title: string }> = (props) => {
  const rsvps = props.rsvps.map((rsvp) => {
    return <Rsvp key={rsvp.marktDate} {...rsvp} updateRsvp={props.updateRsvp} />
  })
  return <WeekUI title={props.title}>{rsvps}</WeekUI>
}

interface IRsvpProps extends IRsvpExt {
  updateRsvp: UpdateRsvpFunctionType
}

const Rsvp: React.VFC<IRsvpProps> = (props) => {
  const updateRsvp = (event: CheckboxChangeEvent) => {
    const attending = event.target.checked
    props.updateRsvp({ ...props, attending })
  }
  return (
    <DayUI
      checked={props.attending}
      onChange={updateRsvp}
      disabled={props.isInThePast}
      name={props.shortName}
      tooltipText={props.marktDate}
    />
  )
}

const WeekUI: React.FC<{ title: string }> = (props) => {
  return (
    <div>
      <h2>{props.title}</h2>
      <div className="rsvp-list">{props.children}</div>
    </div>
  )
}

type DayUIPropsType = {
  checked: boolean
  disabled?: boolean
  tooltipText?: string
  value?: string
  name?: string
  onChange: (event: CheckboxChangeEvent) => void
}

const DayUI: React.FC<DayUIPropsType> = (props) => {
  const DARK_YELLOW = '#fec813'
  const LIGHT_GREY = '#f5f5f5'
  const backgroundColor = props.checked ? DARK_YELLOW : LIGHT_GREY
  const opacity = props.disabled ? 0.4 : 1
  const style = {
    backgroundColor,
    opacity,
  }

  return (
    <Tooltip title={props.tooltipText}>
      <span style={style} className="rsvp-list__day">
        <Checkbox checked={props.checked} onChange={props.onChange} disabled={props.disabled} value={props.value}>
          {props.children}
        </Checkbox>
        <label>{props.name}</label>
      </span>
    </Tooltip>
  )
}

const BackButton: React.VFC = () => {
  const { homeUrl } = React.useContext(RoleContext)
  return (
    <a href={homeUrl}>
      <ArrowLeftOutlined /> Terug
    </a>
  )
}

export default AanwezigheidsPage
