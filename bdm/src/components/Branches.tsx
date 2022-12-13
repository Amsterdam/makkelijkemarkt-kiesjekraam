import React, { Component } from 'react'
import { Button, InputNumber, Select, Switch } from 'antd'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import CSS from 'csstype'

import { AssignedBranche, Branche } from '../models'
import { getTextColor } from '../common/generic'
import { COLOR } from '../constants'

export default class Branches extends Component<{
  id: string
  lookupBranches: Branche[]
  changed?: (lookupBranches: AssignedBranche[]) => void
}> {
  readonly state: { branches?: AssignedBranche[] } = {}

  updateStorage = (branches: AssignedBranche[]) => {
    // Tell the parent component this page has changed.
    const _branches = branches.filter((e) => e.brancheId !== '')
    if (this.props.changed) {
      this.props.changed(_branches)
    }

    this.setState({
      branches,
    })
  }

  getStyle = (branche: AssignedBranche): CSS.Properties => {
    return {
      background: `#${branche.backGroundColor || 'fff'}`,
      color: `#${branche.color || '000'}`,
    }
  }

  getBrancheId = (branche: AssignedBranche, i: number) => {
    let _availableBranches: string[] = []
    if (branche.brancheId) {
      return branche.brancheId
    }
    if (this.state.branches) {
      _availableBranches = this.state.branches?.map((e) => e.brancheId)
    }

    return (
      <Select
        showSearch
        style={{ width: '100%' }}
        placeholder="Selecteer een branche"
        value={branche.brancheId || ''}
        onChange={(e: string) => {
          const _selectedBranche: Branche = this.props.lookupBranches.filter((item: Branche) => item.afkorting === e)[0]
          if (this.state.branches && _selectedBranche) {
            const _branches = this.state.branches
            _branches[i].brancheId = _selectedBranche.afkorting
            _branches[i].backGroundColor = _selectedBranche.color
            _branches[i].color = getTextColor(_selectedBranche.color)
            // Find the color, set the foreground color with the function.
            this.updateStorage(_branches)
          }
        }}
      >
        {this.props.lookupBranches
          .filter((item: Branche) => _availableBranches.indexOf(item.afkorting) === -1)
          .map((br, i) => {
            return (
              <Select.Option key={i} value={br.afkorting}>
                {br.afkorting}
              </Select.Option>
            )
          })}
      </Select>
    )
  }

  getClass(branche: AssignedBranche): string {
    let baseClass: string = ''
    if (branche.brancheId === 'bak') {
      if (branche.verplicht) {
        return 'baking mandatory'
      }
      return 'baking'
    }
    if (branche.maximumPlaatsen) {
      const allocated: number = branche.allocated || 0
      if (branche.maximumPlaatsen < allocated) {
        baseClass += ' over-assigned'
      }
      if (branche.maximumPlaatsen === allocated) {
        baseClass += ' assigned'
      } else {
        baseClass += ' under-assigned'
      }
    } else {
      // Branche has no maximum
      if (branche.allocated) {
        baseClass += ' available'
      }
    }

    if (branche.verplicht) {
      baseClass += ' mandatory'
    }
    return baseClass.trim()
  }

  render() {
    return (
      <>
        {this.state.branches && (
          <>
            <table>
              <thead>
                <tr>
                  <th></th>
                  <th>Code</th>
                  <th>Omschrijving</th>
                  <th>Verplicht</th>
                  <th>Maximum</th>
                  <th>Toegewezen</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {this.state.branches.map((branche, i) => {
                  return (
                    <tr key={i} className={this.getClass(branche)}>
                      <td style={this.getStyle(branche)}>
                        <Button
                          danger
                          type="primary"
                          icon={<DeleteOutlined />}
                          onClick={() => {
                            if (this.state.branches) {
                              let _branches = this.state.branches
                              delete _branches[i]
                              _branches = _branches.filter(() => true)
                              this.updateStorage(_branches)
                            }
                          }}
                        />
                      </td>
                      {branche.brancheId ? (
                        <td>{branche.brancheId.split('-')[0]}</td>
                      ) : (
                        <td style={{ color: 'red' }}>Geen brancheId</td>
                      )}
                      <td>{this.getBrancheId(branche, i)}</td>
                      <td>
                        <Switch
                          checked={branche.verplicht}
                          onChange={(checked: boolean) => {
                            if (this.state.branches) {
                              const _branches = this.state.branches
                              _branches[i].verplicht = checked
                              this.updateStorage(_branches)
                            }
                          }}
                        />
                      </td>
                      <td>
                        <InputNumber
                          min={0}
                          max={999}
                          value={branche.maximumPlaatsen || 0}
                          onChange={(value: string | number | undefined| null) => {
                            if ((value && this.state.branches) || (value === 0 && this.state.branches)) {
                              const _branches = this.state.branches
                              _branches[i].maximumPlaatsen = parseInt(value.toString())
                              this.updateStorage(_branches)
                            }
                          }}
                        />
                      </td>
                      <td>{branche.allocated && <>{branche.allocated}</>}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <Button
              onClick={() => {
                const _branches = this.state.branches || []
                _branches.push({
                  brancheId: '',
                  verplicht: false,
                  color: COLOR.BLACK,
                  backGroundColor: COLOR.WHITE,
                  allocated: 0,
                })
                this.updateStorage(_branches)
              }}
              style={{ marginTop: '20px' }}
              icon={<PlusOutlined />}
            >
              Toevoegen
            </Button>
          </>
        )}
      </>
    )
  }
}
