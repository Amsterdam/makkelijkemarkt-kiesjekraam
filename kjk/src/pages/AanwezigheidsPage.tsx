import { Alert, Card, Checkbox, Col, notification, PageHeader, Row, Space, Tag, Tooltip, Typography } from 'antd'
import { CheckboxChangeEvent } from 'antd/lib/checkbox'
import { ArrowLeftOutlined, UserOutlined, WarningOutlined } from '@ant-design/icons'
import { find, findLast, groupBy, includes, isEmpty, orderBy } from 'lodash'
import React, { useContext, useEffect, useState } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { RoleContext } from '../components/providers/RoleProvider'

import { SaveButton } from '../components/buttons'
import { VASTE_PLAATS_HOUDER_STATUS } from '../constants'
import {
  ErkenningsNummer,
  IAanwezigheidsPageRouteParams,
  IMarktVoorkeur,
  IOndernemer,
  IRsvp,
  IRsvpPattern,
  ISollicitatie,
} from '../models'
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

const checkIfDateIsInThePast = (date: string) => {
  const today = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(today.getDate() + 1)
  return new Date(`${date}T${CUTOFF_TIME}`) <= tomorrow
}

const vervangerWarning = ({ dates, day }: { dates?: string[]; day?: string }) => {
  let description = 'U wilt aanwezig zijn op te veel markten tegelijkertijd.'
  if (dates) {
    description = `${description} Het gaat om de volgende datum(s) of dagen: ${dates
      .map((date) => new Date(date).toLocaleDateString('nl-NL'))
      .join(', ')}`
  }
  if (day) {
    description = `${description} Deze wijziging in patroon is niet toegestaan.`
  }
  notification.warning({
    message: 'Niet toegestaan',
    duration: 0,
    description,
  })
}

interface IRsvpExt extends Omit<IRsvp, 'koopmanErkenningsNummer' | 'marktId'> {
  koopman: ErkenningsNummer
  day: string
  dateNL: string
  shortName: string
  isInThePast: boolean
  isActiveMarketDay: boolean
}

interface IRsvpPatternExt extends Omit<IRsvpPattern, 'erkenningsNummer' | 'markt'> {}

type PatternFunctionType = (patternDay: string, attending: boolean) => void
type UpdateRsvpFunctionType = (updatedRsvp: IRsvpExt) => void
type saveFunctionType = (id: string) => void

const MarktDagenContext = React.createContext<string[]>([])

const AanwezigheidsPage: React.VFC = () => {
  const { erkenningsNummer, marktId } = useParams<IAanwezigheidsPageRouteParams>()
  const ondernemerData = useOndernemer(erkenningsNummer)
  const rsvpData = useRsvp(erkenningsNummer)
  const rsvpPatternData = useRsvpPattern(erkenningsNummer)
  const marktVoorkeurData = useMarktVoorkeur(marktId, erkenningsNummer)
  const marktData = useMarkt(marktId)

  const {
    mutate: saveRsvpApi,
    isLoading: saveRsvpApiInProgress,
    isSuccess: saveRsvpIsSuccess,
    isError: saveRsvpIsError,
  } = useSaveRsvp()
  const {
    mutate: savePatternApi,
    isLoading: savePatternApiInProgress,
    isSuccess: savePatternIsSuccess,
    isError: savePatternIsError,
  } = useSaveRsvpPattern()

  const combinedError = saveRsvpIsError || savePatternIsError

  const [sollicitatie, setSollicitatie] = useState<Partial<ISollicitatie>>({})
  const [rsvps, setRsvps] = useState<IRsvpExt[]>([])
  const [pattern, setPattern] = useState<Partial<IRsvpPatternExt>>({})

  const nVervangers = ondernemerData.data?.vervangers.length || 0
  const rsvpsAtOtherMarkets =
    rsvpData.data?.filter((rsvp) => rsvp.markt !== marktId).filter((rsvp) => rsvp.attending) || []

  const getInvalidDates = (rsvps: IRsvpExt[]) => {
    const combinedRsvps = [...rsvps.filter((rsvp) => rsvp.attending), ...rsvpsAtOtherMarkets]
    const rsvpsPerDate = groupBy(combinedRsvps, 'marktDate')
    const invalidDates = Object.keys(rsvpsPerDate).reduce((total: any[], current: string) => {
      if (rsvpsPerDate[current].length > nVervangers + 1) {
        return [...total, current]
      }
      return total
    }, [])
    return invalidDates.filter((date) => !checkIfDateIsInThePast(date))
  }

  const updateRsvp: UpdateRsvpFunctionType = (updatedRsvp) => {
    const updatedRsvps = rsvps.map((rsvp) => {
      if (rsvp.marktDate === updatedRsvp.marktDate) {
        return updatedRsvp
      }
      return rsvp
    })
    const invalidDates = getInvalidDates(updatedRsvps)
    if (includes(invalidDates, updatedRsvp.marktDate)) {
      vervangerWarning({ dates: invalidDates })
    } else {
      setRsvps(updatedRsvps)
    }
  }

  const updatePattern: PatternFunctionType = (patternDay, attending) => {
    const syncedRsvps = syncRsvpsWithUpdatedPatternDay(patternDay, attending)
    const invalidDays = getInvalidDates(syncedRsvps).map((date: string) =>
      new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()
    )
    if (includes(invalidDays, patternDay)) {
      vervangerWarning({ day: patternDay })
    } else {
      setPattern({
        ...pattern,
        [patternDay]: attending,
      })
      setRsvps(syncedRsvps)
    }
  }

  const syncRsvpsWithUpdatedPatternDay: (patternDay: string, attending: boolean) => IRsvpExt[] = (
    patternDay,
    attending
  ) => {
    return rsvps.map((rsvp) => {
      if (rsvp.day === patternDay && !rsvp.isInThePast) {
        return {
          ...rsvp,
          attending,
        }
      }
      return rsvp
    })
  }

  const save = async () => {
    const invalidDates = getInvalidDates(rsvps)
    if (invalidDates.length) {
      vervangerWarning({ dates: invalidDates })
    } else {
      await saveRsvps()
      await savePattern()
    }
  }

  const saveRsvps = async () => {
    saveRsvpApi(
      rsvps
        .filter((rsvp) => rsvp.markt === marktId)
        .map((rsvp) => {
          return {
            ...rsvp,
            koopmanErkenningsNummer: rsvp.koopman,
            marktId,
          }
        })
    )
  }

  useEffect(() => {
    if (saveRsvpIsSuccess && savePatternIsSuccess) {
      notification.success({
        message: 'Opgeslagen',
        description: 'Uw aanwezigheidsvoorkeuren zijn opgeslagen',
      })
    }
  }, [saveRsvpIsSuccess, savePatternIsSuccess])

  useEffect(() => {
    if (combinedError) {
      notification.error({
        message: 'Fout tijdens opslaan',
        description: 'Uw aanwezigheidsvoorkeuren zijn niet opgeslagen',
        duration: 0,
      })
    }
  }, [combinedError])

  const savePattern = async () => {
    const patternData = {
      ...pattern,
      erkenningsNummer,
      markt: marktId,
    }
    savePatternApi(patternData as IRsvpPattern)
  }

  useEffect(() => {
    if (ondernemerData.data && marktData.data && rsvpPatternData.data && rsvpData.data) {
      // MARKT
      const { marktDagen = [] } = marktData.data || {}

      // ONDERNEMER
      const orderedSollicitaties = orderBy(ondernemerData.data?.sollicitaties, 'id')
      const sollicitatie: Partial<ISollicitatie> =
        findLast(orderedSollicitaties, (s) => String(s.markt.id) === marktId && !s.doorgehaald) || {}
      setSollicitatie(sollicitatie)
      const isStatusLikeVpl = includes(VASTE_PLAATS_HOUDER_STATUS, sollicitatie.status)

      // PATTERN
      let pattern: Partial<IRsvpPatternExt> = {}
      const patternFromApi: IRsvpPattern | undefined = find(rsvpPatternData.data, (p) => p.markt === marktId)
      if (!patternFromApi) {
        Object.keys(WEEKDAY_NAME_MAP).forEach((day) => {
          pattern[day as keyof IRsvpPatternExt] =
            isStatusLikeVpl && includes(marktDagen, WEEKDAY_NAME_MAP[day as keyof IRsvpPatternExt])
        })
      } else {
        const { monday, tuesday, wednesday, thursday, friday, saturday, sunday } = patternFromApi
        pattern = { monday, tuesday, wednesday, thursday, friday, saturday, sunday }
      }
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
            dateNL: date.toLocaleDateString('nl-NL'),
            isInThePast: checkIfDateIsInThePast(marktDate),
            isActiveMarketDay: includes(marktDagen, shortName),
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
      setRsvps(mergedRsvps)
    }
  }, [erkenningsNummer, marktId, ondernemerData.data, marktData.data, rsvpPatternData.data, rsvpData.data])

  const rsvpPerMarkt = groupBy(rsvps, 'markt')
  const marktVoorkeur: Partial<IMarktVoorkeur> = marktVoorkeurData.data || {}
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
      marktDagen={marktData.data?.marktDagen}
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
              <MarktDagenContext.Provider value={marktData.data?.marktDagen || []}>
                <Ondernemer {...ondernemerData.data} />
                <Messages showMissingBrancheWarning={!hasValidBranche} marktData={marktData.data} />
                {ondernemerData.data && hasValidBranche && sollicitatie.status && marktComponent}
              </MarktDagenContext.Provider>
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
  marktDagen?: string[]
  apiInProgress: boolean
  rsvps: IRsvpExt[]
  pattern: IRsvpPatternExt
  save: saveFunctionType
  updateRsvp: UpdateRsvpFunctionType
  updatePattern: PatternFunctionType
}
const Markt: React.VFC<MarktPropsType> = (props) => {
  const role = useContext(RoleContext)

  const extra = [
    <Tag key="sollicitatieStatus" color="#00A03C">
      {props.sollicitatieStatus}
    </Tag>,
    <Tag key="sollicitatieNummer" color="#000000">
      {props.sollicitatieNummer}
    </Tag>,
  ]

  if (role.isMarktMeester === false) {
    extra.push(
      <SaveButton key="save" clickHandler={() => props.save(props.id)} inProgress={props.apiInProgress}>
        Opslaan
      </SaveButton>
    )
  }

  return (
    <Card title={props.name} extra={extra}>
      <Space direction="vertical" size="large">
        <Pattern markt={props.id} pattern={props.pattern} updatePattern={props.updatePattern} />
        <Space size={[64, 16]} wrap>
          {props.rsvps && <RsvpList title="Deze week" rsvps={props.rsvps.slice(0, 7)} updateRsvp={props.updateRsvp} />}
          {props.rsvps && <RsvpList title="Volgende week" rsvps={props.rsvps.slice(7)} updateRsvp={props.updateRsvp} />}
        </Space>
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
        />
      )}
      {props.showMissingBrancheWarning || (
        <Alert
          icon={<WarningOutlined />}
          message={<h3>Digitaal ingedeeld? Dan ook komen!</h3>}
          description={mandatoryPresenceWarning}
          type="warning"
          showIcon
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
}

const Pattern: React.VFC<PatternPropsType> = (props) => {
  const updatePattern = (event: CheckboxChangeEvent) => {
    const attending = event.target.checked
    const patternDay = event.target.value
    props.updatePattern(patternDay, attending)
  }

  const role = useContext(RoleContext)
  const marktDagen = useContext(MarktDagenContext)
  const renderedPattern = Object.keys(props.pattern).map((item) => {
    const name = WEEKDAY_NAME_MAP[item as keyof IRsvpPatternExt]
    return (
      <DayUI
        key={item}
        onChange={updatePattern}
        checked={props.pattern[item as keyof IRsvpPatternExt]}
        disabled={!includes(marktDagen, name) || role.isMarktMeester}
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

  const role = useContext(RoleContext)

  return (
    <DayUI
      checked={props.attending}
      onChange={updateRsvp}
      disabled={props.isInThePast || !props.isActiveMarketDay || role.isMarktMeester}
      name={props.shortName}
      tooltipText={props.dateNL}
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
  const history = useHistory()
  return (
    <Link onClick={history.goBack}>
      <ArrowLeftOutlined /> Terug
    </Link>
  )
}

export default AanwezigheidsPage
