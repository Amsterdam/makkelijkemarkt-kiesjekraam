import PropTypes from 'prop-types';
import React from 'react';

const MarktList = ({ markten }) => {
    return (
        <div>
            <ul className="LinkList">
                {markten.map(markt => (
                    <li key={markt.id} className="LinkList__item">
                        <a href={`/markt/${markt.id}/`} className="Link">
                            {markt.naam}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
};

MarktList.propTypes = {
    markten: PropTypes.arrayOf(PropTypes.object),
};

module.exports = MarktList;
