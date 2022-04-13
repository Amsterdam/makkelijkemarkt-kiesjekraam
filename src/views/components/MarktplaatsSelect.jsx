import PropTypes from 'prop-types';
import React from 'react';

const MarktplaatsSelect = ({ id, name, data, value, optional, readonly, newItem }) => {
    const attrs = newItem ? { 'data-id': id, 'data-name': name } : { id, name };

    return (
        <div
            className={`Select__wrapper Select__wrapper--MarktplaatsSelect ${
                readonly ? 'Select__wrapper--disabled' : null
            }`}
        >
            <select className="Select Select--MarktplaatsSelect" {...attrs} disabled={readonly}>
                {optional ? <option value="">Plaatsnummer</option> : null}
                {data.map(plaats => (
                    <option
                        key={plaats.plaatsId}
                        value={plaats.plaatsId}
                        disabled={plaats.disabled}
                        selected={plaats.plaatsId === value}
                    >
                        {plaats.plaatsId}
                    </option>
                ))}
            </select>
        </div>
    );
};

MarktplaatsSelect.propTypes = {
    data: PropTypes.array.isRequired,
    value: PropTypes.string,
    id: PropTypes.string,
    name: PropTypes.string,
    optional: PropTypes.bool,
    readonly: PropTypes.string,
    newItem: PropTypes.string,
};

module.exports = MarktplaatsSelect;
