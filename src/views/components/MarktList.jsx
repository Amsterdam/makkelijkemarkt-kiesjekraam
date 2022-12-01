import { Roles } from '../../authentication';
import PropTypes from 'prop-types';
import React from 'react';
import { formatDate, relativeHumanDay } from '../../util'

const MarktList = ({ markten, role }) => {

    const isKramenzetter = role === Roles.KRAMENZETTER
    const getUrl = (markt) => {
        if (isKramenzetter) {
            return `/kramenzetter/${markt.id}/${markt.nextIndelingsDate}/indeling`
        }

        return `/markt/${markt.id}/`
    }

    const formatDateString = (date) => {
        // Ex: vandaag (10 nov '22)
        return `${relativeHumanDay(date)} (${formatDate(date)})`
    }

    return (
        <div>
            <ul className="LinkList">
                {markten.map((markt) => {
                    return (isKramenzetter && !markt.nextIndelingsDate) ?
                        (
                            <li key={markt.id} className="LinkList__item">
                                <a className="Link Link--disabled">
                                    {markt.naam} - geen indeling beschikbaar
                                </a>
                            </li>
                        ) :
                        (
                            <li key={markt.id} className="LinkList__item">
                                <a href={getUrl(markt)} className="Link">
                                    {markt.naam} {isKramenzetter && `- ${formatDateString(markt.nextIndelingsDate)}`}
                                </a>
                            </li>
                        )
                    }
                )}
            </ul>
        </div>
    );
};

MarktList.propTypes = {
    markten: PropTypes.arrayOf(PropTypes.object),
    role: PropTypes.string
};

module.exports = MarktList;
