import PropTypes from 'prop-types';
import React from 'react';

class Page extends React.Component {
    propTypes = {
        children: PropTypes.optionalNode,
        decorator: PropTypes.string,
        csrfToken: PropTypes.string,
        dataAttributes: PropTypes.array,
        className: PropTypes.string,
    };

    render() {
        const { csrfToken, decorator, dataAttributes, className } = this.props;
        return (
            <form
                className={`Form ${className}`}
                method="POST"
                encType="application/x-www-form-urlencoded"
                data-decorator={decorator}
            >
                <input type="hidden" name="_csrf" value={csrfToken} />
                {this.props.children}
            </form>
        );
    }
}

module.exports = Page;
