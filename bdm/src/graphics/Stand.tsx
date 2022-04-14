import React, { Component } from 'react'
import { AssignedBranche, Lot } from '../models'
import SvgBak from './SvgBak'
import SvgBakLight from './SvgBakLight'
import SvgBench from './SvgBench'
import SvgElectra from './SvgElectra'
import SvgLight from './SvgLight'
import SvgTree from './SvgTree'
import SvgWater from './SvgWater'

export default class Stand extends Component<{
  stand: Lot
  branche?: AssignedBranche
  classDef: string
  invert: boolean
}> {
  renderVerkoopinrichting = () => {
    const { stand, invert } = this.props
    let facilityPosition: { x: number; y: number } = { x: 2, y: 20 }
    let facilityColor = this.getFillColor() //"#faad14"
    if (invert) {
      facilityPosition = { x: 2, y: 2 }
    }
    if (stand.verkoopinrichting && stand.verkoopinrichting.length > 0)
      return (
        <g>
          <rect x={facilityPosition.x} y={facilityPosition.y} height={28} width={6} fill={facilityColor} />
        </g>
      )
  }

  renderProperties = () => {
    const { invert, stand } = this.props
    let propertyPosition: { x: number; y: number } = { x: 36, y: 31 }
    if (invert) {
      propertyPosition = { x: 36, y: 1 }
    }
    if (stand.properties) {
      return stand.properties.map((prop: string, i: number) => {
        switch (prop) {
          case 'bankje':
            propertyPosition = invert ? { x: 24, y: 13 } : { x: 24, y: 20 }
            return <SvgBench key={i} invert={invert} color="#c75819" position={propertyPosition} />
          case 'electra':
            propertyPosition = invert ? { x: 36, y: 3 } : { x: 36, y: 31 }
            return <SvgElectra key={i} invert={invert} color="#000" position={propertyPosition} />
          case 'water':
            propertyPosition = invert ? { x: 10, y: 2 } : { x: 10, y: 35 }
            return <SvgWater key={i} invert={invert} color="#1890ff" position={propertyPosition} />
          case 'boom':
            propertyPosition = invert ? { x: 10, y: 15 } : { x: 10, y: 21 }
            return <SvgTree key={i} invert={invert} color="#73ab4f" position={propertyPosition} />
          case 'lantaarnpaal':
            propertyPosition = invert ? { x: 32, y: 12 } : { x: 32, y: 15 }
            return <SvgLight key={i} invert={invert} color="yellow" position={propertyPosition} />
          default:
            return <></>
        }
      })
    }
    return <></>
  }

  renderBranches = () => {
    const { stand, invert } = this.props
    let branchesPosition: { x: number; y: number } = { x: 23, y: 36 }
    let brancheColor = '#777'
    if (invert) {
      branchesPosition = { x: 23, y: 3 }
    }
    // Contains bak?
    return (
      <>
        {stand.bakType === 'bak' && (
          <SvgBak color={brancheColor} position={branchesPosition} />
        )}
        {stand.bakType === 'bak-licht' && (
          <SvgBakLight color={brancheColor} position={branchesPosition} />
        )}
      </>
    )
  }

  getStrokeColor = () => {
    const { classDef, branche } = this.props
    if (classDef.indexOf('selected') > -1) {
      return '#1890ff'
    }
    if (branche && branche.backGroundColor) {
      return `#${branche.backGroundColor}`
    }
    return '#fafafa'
  }

  getFillColor = () => {
    const { branche } = this.props
    if (branche && branche.backGroundColor) {
      return `#${branche.backGroundColor}`
    }
    return '#fafafa'
  }

  getTextColor = () => {
    const { branche, stand } = this.props
    if (stand && stand.invalid) {
      return '#f00'
    }

    if (branche && branche.color) {
      return `#${branche.color}`
    }

    return '#000000'
  }

  render() {
    const { invert, stand } = this.props
    let x = 0
    let y = 0
    if (invert) {
      x = 0
      y = 28
    }
    const width = 50
    const height = 20

    let strokeColor = this.getStrokeColor()
    let fillColor = this.getFillColor()
    let textColor = this.getTextColor()

    return (
      <svg style={{ width: '50px' }} viewBox="0 0 50 50">
        <g>
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            style={{
              fill: fillColor,
              stroke: 'none',
              strokeWidth: '0px',
            }}
          />
          <text
            x={x + width / 2}
            y={y + height / 2}
            style={{ fill: textColor }}
            dominantBaseline="middle"
            textAnchor="middle"
            fontSize="1em"
          >
            {stand.plaatsId}
          </text>
          {/* <text x={x + width / 2}
                    y={y + height / 2 + 5}
                    style={{ fill: textColor }}
                    dominantBaseline="middle"
                    textAnchor="middle"
                    fontSize="0.7em">
                {stand.blockPosition && <>{`${stand.blockPosition[0]}-${stand.blockPosition[1]}`}</>}</text> */}
          {this.renderBranches()}
          <rect
            x={0}
            y={0}
            width={50}
            height={50}
            style={{
              fill: 'none',
              stroke: strokeColor,
              strokeWidth: '4px',
            }}
          />
        </g>
        {this.renderVerkoopinrichting()}
        {this.renderProperties()}
      </svg>
    )
  }
}
