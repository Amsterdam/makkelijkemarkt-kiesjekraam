import React, { useEffect, useRef, useState } from 'react'
import { useMarktConfig, useSaveMarktConfig } from '../hooks'

const marginLeft = { marginLeft: '1rem' }
const marginTop = { marginTop: '1rem' }
const padding = { padding: '1rem' }

const Disclaimer: React.VFC = () => <h2>Temporary page for use by developers only</h2>

export const DownloadPage: React.VFC = () => {
  const ref: any = useRef()
  const [source, setSource] = useState('')

  return (
    <div>
      <Disclaimer />
      <div>
        <input placeholder="id bron markt" ref={ref} onChange={() => setSource('')} />
        <button onClick={() => setSource(ref.current.value)} style={marginLeft}>
          toon marktconfiguratie
        </button>
      </div>
      {source && <ConfigBlock marktId={source} />}
    </div>
  )
}

const ConfigBlock: React.VFC<{ marktId: string }> = (props) => {
  const marktConfig = useMarktConfig(props.marktId)
  const { branches, locaties, marktOpstelling, geografie, paginas } = marktConfig.data || {}
  const marktConfiguratie = marktConfig.data
    ? JSON.stringify({ branches, locaties, marktOpstelling, geografie, paginas })
    : ''

  const style = { backgroundColor: 'aliceblue', ...padding, ...marginTop }
  return (
    <div style={style}>
      {marktConfiguratie && (
        <button
          onClick={() => {
            navigator.clipboard.writeText(marktConfiguratie)
          }}
        >
          COPY to clipboard
        </button>
      )}
      <div style={marginTop}>{marktConfiguratie}</div>
    </div>
  )
}

export const UploadPage: React.VFC = () => {
  const [target, setTarget] = useState('')
  const [config, setConfig] = useState('')
  const { mutate: saveMarktConfig, isLoading: saveInProgress } = useSaveMarktConfig(target)

  const save = () => {
    saveMarktConfig(JSON.parse(config))
  }

  let backgroundColor
  let valid = false
  try {
    JSON.parse(config)
    backgroundColor = '#99C140'
    valid = true
  } catch (e) {
    backgroundColor = '#CC3232'
  } finally {
    backgroundColor = config ? backgroundColor : 'aliceblue'
  }

  useEffect(() => {
    setConfig('')
    setTarget('')
  }, [saveInProgress])

  const style = { backgroundColor, ...padding, ...marginTop }
  return (
    <div>
      <Disclaimer />
      <div>
        <input placeholder="id van doel markt" value={target} onChange={(event) => setTarget(event.target.value)} />
      </div>
      <div style={style}>
        <label>marktconfiguratie</label>
        <textarea value={config} onChange={(event) => setConfig(event.target.value)}></textarea>
      </div>
      <div style={marginTop}>{target && valid && <button onClick={save}>Overschrijven</button>}</div>
    </div>
  )
}
