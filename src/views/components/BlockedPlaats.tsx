import * as React from 'react';

interface BlockedPlaatsProps {
    plaatsnummer: number;
}

const BlockedPlaats: React.FC<BlockedPlaatsProps> = ({ plaatsnummer }) => (
    <tr className="Plaats Plaats--first">
        <td className="Plaats__prop"></td>
        <td className="Plaats__prop Plaats__prop-plaats-nr">{plaatsnummer}</td>
        <td className="Plaats__prop">x</td>
        <td className="Plaats__prop">x</td>
        <td className="Plaats__prop">x</td>
        <td className="Plaats__prop">x</td>
        <td className="Plaats__prop">x</td>
        <td className="Plaats__prop">x</td>
    </tr>
);

export default BlockedPlaats;
