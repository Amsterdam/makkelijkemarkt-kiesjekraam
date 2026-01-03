import * as React from 'react';
import {
    IMarkt,
    IRSVP
} from '../../model/markt.model';
import PropTypes from 'prop-types';

interface IAanwezigheid {
    present: boolean;
    erkenningsNummer: string;
    kind: string;
    name: string;
    rank: string;
}

const OndernemerList = ({
    ondernemers,
}: {
    ondernemers: IAanwezigheid[];
    markt: IMarkt;
    aanmeldingen: IRSVP[];
    plaatsvoorkeuren: any;
    algemenevoorkeuren: any;
}) => (
    <div className="OndernemerList">
        <span className="OndernemerList__heading">Personen</span>
        <table className="OndernemerList__table">
            <tbody>
                {ondernemers.map(ondernemer => {
                    const kind = ondernemer.kind.toLowerCase()
                    return (
                        <tr key={ondernemer.erkenningsNummer} className={kind}>
                            <td>
                                <span id={`soll-${ondernemer.rank}`} />
                                <a href={`/profile/${ondernemer.erkenningsNummer}`}>{ondernemer.rank}</a>
                            </td>
                            <td>{kind}</td>
                            <td>{ondernemer.name}</td>

                            <td className={ondernemer.present ?
                                'OndernemerList__ondernemer--attending' : 'OndernemerList__ondernemer--not-attending'} />
                        </tr>
                    );
                })}
            </tbody>
        </table>
    </div>
);

OndernemerList.propTypes = {
    ondernemers: PropTypes.arrayOf(PropTypes.object),
    markt: PropTypes.object,
    aanmeldingen: PropTypes.array,
    plaatsvoorkeuren: PropTypes.object,
    algemenevoorkeuren: PropTypes.object,
};

module.exports = OndernemerList;
