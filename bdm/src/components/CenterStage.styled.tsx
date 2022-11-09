import styled from 'styled-components'

type Props = {
  center?: 'horizontal' | 'vertical' | 'both'
}

export default styled.div<Props>(({ center = 'both' }) => {
  let x = '50%'
  let y = '50%'
  if (center === 'horizontal') {
    y = '0'
  }
  if (center === 'vertical') {
    x = '0'
  }
  return `
      position: absolute;
      top: ${y};
      left: ${x};
      z-index: 99;
      transform: translate(-${x}, -${y});
    `
})
