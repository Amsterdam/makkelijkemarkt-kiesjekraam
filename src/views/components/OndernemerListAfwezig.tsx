import * as React from 'react';
import {
    IMarktondernemer,
} from '../../model/markt.model';
import moment from 'moment';
import PropTypes from 'prop-types';

const OndernemerList = ({
    ondernemers,
}: {
    ondernemers: IMarktondernemer[];
}) => (
    <div className="OndernemerList">
        <span className="OndernemerList__heading">Personen</span>
        <table className="OndernemerList__table">
            <tbody>
                {ondernemers.map(ondernemer => {
                    return (
                        <tr key={ondernemer.erkenningsNummer} className={ondernemer.status}>
                            <td>
                                <span id={`soll-${ondernemer.sollicitatieNummer}`} />
                                <a href={`/profile/${ondernemer.erkenningsNummer}`}>{ondernemer.sollicitatieNummer}</a>
                            </td>
                            <td>{ondernemer.status}</td>
                            <td>{ondernemer.description}</td>
                            {ondernemer.voorkeur.absentFrom && ondernemer.voorkeur.absentUntil ? (
                                <td className="small">
                                    <span className={`Pil Pil--${ondernemer.status}`}>
                                        {moment(ondernemer.voorkeur.absentFrom).format('DD-MM-YYYY')}{' '}
                                        <strong> t/m </strong>{' '}
                                        {moment(ondernemer.voorkeur.absentUntil).format('DD-MM-YYYY')}
                                    </span>
                                </td>
                            ) : (
                                <td></td>
                            )}
                        </tr>
                    );
                })}
            </tbody>
        </table>
    </div>
);

OndernemerList.propTypes = {
    ondernemers: PropTypes.arrayOf(PropTypes.object),
};

module.exports = OndernemerList;
