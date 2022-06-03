import React, { Component } from 'react'

export default class SvgBak extends Component<{ color: string; invert?: boolean; position: { x: number; y: number } }> {
  render() {
    return (
      <svg
        x={this.props.position.x}
        y={this.props.position.y}
        width="12"
        height="10"
        viewBox="0 0 3.1750002 2.6458334"
        version="1.1"
        id="bak-licht"
        data-testid="icon-bak-licht"
      >
        <defs id="defs2" />
        <metadata id="metadata5"></metadata>
        <g id="bak-group">
          <path
            style={{
              fill: 'none',
              stroke: this.props.color,
              strokeWidth: 0.4,
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              strokeOpacity: 1,
            }}
            d="m 0.52916667,0.26458333 c -0.308253,0.32951306 -0.395034,0.67574122 0,1.05833327 0.4596438,0.4585767 0.2288171,0.7582237 0,1.0583334"
            id="path1048"
          />
          <path
            style={{
              fill: 'none',
              stroke: this.props.color,
              strokeWidth: 0.4,
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              strokeOpacity: 1,
            }}
            d="m 1.5875,0.26458333 c -0.308253,0.3295131 -0.395034,0.6757413 0,1.05833327 0.4596438,0.4585767 0.2288171,0.7582237 0,1.0583334"
            id="path1048-5"
          />
        </g>
      </svg>
    )
  }
}
