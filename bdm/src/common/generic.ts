import JSZip from 'jszip'
import { AssignedBranche, Geography, Lot, Page, Rows } from '../models'
import { BranchesService, GeographyService, LotsService, PagesService, RowsService } from '../services/service_markets'
import { message } from 'antd'

export const getLocalStorageMarkets = (): string[] => {
  const _markets: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    let key = localStorage.key(i)
    if (key) {
      if (key.includes('bwdm_cache_') && key !== 'bwdm_cache_markets') {
        const marketComponent = key.replace('bwdm_cache_', '').split('_')[0]
        if (_markets && !(_markets.indexOf(marketComponent) > -1)) {
          _markets.push(marketComponent)
        }
      }
    }
  }
  return _markets
}
const zeroPad = (num: number, places: number) => String(num).padStart(places, '0')

export const getDatePart = () => {
  const _date = new Date()
  const month = zeroPad(_date.getUTCMonth() + 1, 2)
  const day = zeroPad(_date.getUTCDate(), 2)
  const year = _date.getUTCFullYear()
  return year + '' + month + '' + day
}

export const getTextColor = (hexcolor: string): string => {
  var r = parseInt(hexcolor.substr(1, 2), 16)
  var g = parseInt(hexcolor.substr(3, 2), 16)
  var b = parseInt(hexcolor.substr(4, 2), 16)
  var yiq = (r * 299 + g * 587 + b * 114) / 1000
  // Return new color if to dark, else return the original
  return yiq < 40 ? '#2980b9' : 'black'
}

export const getDayNumber = (day: string) => {
  switch (day) {
    case 'MA': {
      return 1
    }
    case 'DI': {
      return 2
    }
    case 'WO': {
      return 3
    }
    case 'DO': {
      return 4
    }
    case 'VR': {
      return 5
    }
    case 'ZA': {
      return 6
    }
    case 'ZO': {
      return 7
    }
    default: {
      return
    }
  }
}

export const getCacheName = (file: string) => {
  switch (file) {
    case 'branches.json':
      return 'branches'
    case 'daysClosed.json':
      return 'daysclosed'
    case 'mededelingen.json':
      return 'announcements'
    case 'obstakeltypes.json':
      return 'obstacletypes'
    case 'plaatseigenschappen.json':
      return 'properties'
    case 'geografie.json':
      return 'geography'
    case 'locaties.json':
      return 'lots'
    case 'paginas.json':
      return 'pages'
    case 'markt.json':
      return 'rows'
    default:
      return
  }
}

export const getFileName = (key: string) => {
  switch (key) {
    case 'pages':
      return 'paginas.json'
    case 'lots':
      return 'locaties.json'
    case 'geography':
      return 'geografie.json'
    case 'branches':
      return 'branches.json'
    case 'rows':
      return 'markt.json'
    case 'daysclosed':
      return 'daysClosed.json'
    case 'announcements':
      return 'mededelingen.json'
    case 'obstacletypes':
      return 'obstakeltypes.json'
    case 'properties':
      return 'plaatseigenschappen.json'
    default:
      return ''
  }
}

export const zipAll = () => {
  const zip = new JSZip()
  // Get the generics first
  ;['branches', 'daysclosed', 'announcements', 'obstacletypes', 'properties'].forEach((key: string) => {
    const data = localStorage.getItem(`bwdm_lookup_${key}`)
    if (data) {
      zip.file(`config/markt/${getFileName(key)}`, JSON.stringify(JSON.parse(data), null, 2))
    }
  })

  // // Grab all the localstorage objects and put them in a single zipfile for download!
  getLocalStorageMarkets().forEach((_m: string) => {
    ;['branches', 'geography', 'lots', 'pages', 'rows'].forEach((key: string) => {
      let data = localStorage.getItem(`bwdm_cache_${_m}_${key}`)

      if (key === 'branches') {
        // Strip color, allocated and backGroundColor
        let _nBranches: AssignedBranche[] = []
        if (data) {
          JSON.parse(data).forEach((_nB: AssignedBranche) => {
            const _tmp: any = {
              brancheId: _nB.brancheId,
              verplicht: _nB.verplicht || false,
            }
            if (_nB.maximumPlaatsen && _nB.maximumPlaatsen > -1) {
              _tmp.maximumPlaatsen = _nB.maximumPlaatsen
            }
            _nBranches.push(_tmp)
          })
        }
        data = JSON.stringify(_nBranches)
      }
      if (data) {
        zip.file(`config/markt/${_m}/${getFileName(key)}`, JSON.stringify(JSON.parse(data), null, 2))
      }
    })
  })

  zip.generateAsync({ type: 'base64' }).then(function (content) {
    downloadObjectAsZip('data:application/zip;base64,' + content, `${getDatePart()}_bewerkdemarkten.zip`)
  })
}

export const zipMarket = (marketDayId: string) => {
  const zip = new JSZip()

  // Grab all the localstorage objects and put them in a single zipfile for download!
  ;['branches', 'geography', 'lots', 'pages', 'rows'].forEach((key: string) => {
    const data = localStorage.getItem(`bwdm_cache_${marketDayId}_${key}`)
    if (data) {
      zip.file(`config/markt/${marketDayId}/${getFileName(key)}`, JSON.stringify(JSON.parse(data), null, 2))
    }
  })

  zip.generateAsync({ type: 'base64' }).then(function (content) {
    downloadObjectAsZip('data:application/zip;base64,' + content, `${getDatePart()}_${marketDayId}.zip`)
  })
}

export const uploadMarket = async (marketDayId: string) => {
  let success: string[] = []
  let errors: string[] = []
  const _branchesFromStorage: string | null = localStorage.getItem(`bwdm_cache_${marketDayId}_branches`)
  const _geographyFromStorage: string | null = localStorage.getItem(`bwdm_cache_${marketDayId}_geography`)
  const _lotsFromStorage: string | null = localStorage.getItem(`bwdm_cache_${marketDayId}_lots`)
  const _pagesFromStorage: string | null = localStorage.getItem(`bwdm_cache_${marketDayId}_pages`)
  const _rowsFromStorage: string | null = localStorage.getItem(`bwdm_cache_${marketDayId}_rows`)
  if (_branchesFromStorage) {
    await new BranchesService()
      .update(marketDayId, JSON.parse(_branchesFromStorage) as AssignedBranche[])
      .then((result) => {
        if (result === 'ok') {
          success.push('branches')
        } else {
          errors.push('branches')
        }
      })
  }
  if (_geographyFromStorage) {
    await new GeographyService().update(marketDayId, JSON.parse(_geographyFromStorage) as Geography).then((result) => {
      if (result === 'ok') {
        success.push('geografie')
      } else {
        errors.push('geografie')
      }
    })
  }
  if (_lotsFromStorage) {
    await new LotsService().update(marketDayId, JSON.parse(_lotsFromStorage) as Lot[]).then((result) => {
      if (result === 'ok') {
        success.push('locaties')
      } else {
        errors.push('locaties')
      }
    })
  }
  if (_pagesFromStorage) {
    await new PagesService().update(marketDayId, JSON.parse(_pagesFromStorage) as Page[]).then((result) => {
      if (result === 'ok') {
        success.push("pagina's")
      } else {
        errors.push("pagina's")
      }
    })
  }
  if (_rowsFromStorage) {
    await new RowsService().update(marketDayId, JSON.parse(_rowsFromStorage) as Rows).then((result) => {
      if (result === 'ok') {
        success.push('markt')
      } else {
        errors.push('markt')
      }
    })
  }
  if (success.length > 0) {
    message.success(`Upload ${success.join(', ')} voor ${marketDayId} geslaagd.`)
  }
  if (errors.length > 0) {
    message.error(`Upload ${errors.join(', ')} voor ${marketDayId} mislukt.`)
  }
}

export const downloadObjectAsZip = (base64: string, filename: string) => {
  let downloadAnchorNode = document.createElement('a')
  downloadAnchorNode.setAttribute('href', base64)
  downloadAnchorNode.setAttribute('download', filename)
  document.body.appendChild(downloadAnchorNode) // required for firefox
  downloadAnchorNode.click()
  downloadAnchorNode.remove()
}
