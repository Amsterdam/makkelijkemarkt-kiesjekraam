import PropTypes from 'prop-types';
import React from 'react';

const EmailTable = ({ data, title }) => {
    const fullWidth = 100;
    const tdStyle = { verticalAlign: 'top', paddingRight: '10px', width: fullWidth / data[0].length + '%' };
    const titleStyle = { margin: '5px 0' };
    const tableStyle = { marginBottom: '20px' };

    return (
        <table width="100%" border="0" cellSpacing="0" cellPadding="0">
            <tr>
                <td>
                    {title ? <h4 style={titleStyle}>{title}</h4> : ''}
                    <table width="100%" border="0" cellSpacing="0" cellPadding="0" style={tableStyle}>
                        {data.map((row, j) => (
                            <tr key={j}>
                                {row.map((col, i) => (
                                    <td style={tdStyle} key={i}>
                                        {i === 0 ? <span>{col}</span> : <span>{col}</span>}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </table>
                </td>
            </tr>
        </table>
    );
};

EmailTable.propTypes = {
    data: PropTypes.array,
    title: PropTypes.string,
};

export default EmailTable;
