import PropTypes from 'prop-types';
import React from 'react';

class ActivateForm extends React.Component {
    propTypes = {
        username: PropTypes.string,
        code: PropTypes.string,
    };

    render() {
        return (
            <form className="Form" method="POST" action="/activeren">
                <fieldset className="Fieldset">
                    <p className="InputField">
                        <label className="Label" htmlFor="username">
                            Registratienummer:
                        </label>
                        <span className="Fieldset__sub-header">
                            Hier vult u uw registratienummer in <b>zonder punt</b>.
                        </span>
                        <input
                            className="Input Input--text"
                            id="username"
                            name="username"
                            autoComplete="username"
                            required
                            defaultValue={this.props.username}
                        />
                    </p>
                    <p className="InputField">
                        <label className="Label" htmlFor="code">
                            Activatiecode:
                        </label>
                        <input
                            className="Input Input--code"
                            id="code"
                            name="code"
                            type="code"
                            required
                            defaultValue={this.props.code}
                        />
                    </p>
                    <p className="InputField InputField--submit">
                        <input className="Input Input--submit-primary" type="submit" value="Activeren" />
                    </p>
                </fieldset>
            </form>
        );
    }
}

module.exports = ActivateForm;
