import PropTypes from 'prop-types';
import React from 'react';
const Content = require('./components/Content');
const Header = require('./components/Header');
const ActivateForm = require('./components/ActivateForm.jsx');
const Page = require('./components/Page.jsx');

class ActivatePage extends React.Component {
    propTypes = {
        messages: PropTypes.array,
        username: PropTypes.string,
        code: PropTypes.string,
    };

    render() {
        return (
            <Page messages={this.props.messages}>
                <Header hideLogout={true} />
                <Content>
                    <h1 className="h1">Account activeren</h1>
                    <ActivateForm {...this.props} />
                </Content>
            </Page>
        );
    }
}

module.exports = ActivatePage;
