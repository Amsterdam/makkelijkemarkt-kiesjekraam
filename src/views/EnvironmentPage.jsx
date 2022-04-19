import PropTypes from 'prop-types';
import React from 'react';
const Content = require('./components/Content');
const Page = require('./components/Page.jsx');
const Header = require('./components/Header');

class AanmeldPage extends React.Component {
    propTypes = {
        aanmeldingen: PropTypes.array,
        date: PropTypes.string.isRequired,
        ondernemer: PropTypes.object.isRequired,
        markt: PropTypes.object,
    };

    render() {
        return (
            <Page>
                <Header />
                <Content>
                    <p>API_KEY: {process.env.API_KEY}</p>
                    <p>API_MMAPPKEY: {process.env.API_MMAPPKEY}</p>
                    <p>API_URL: {process.env.API_URL}</p>
                    <p>APP_SECRET: {process.env.APP_SECRET}</p>
                    <p>IAM_ADMIN_PASS: {process.env.IAM_ADMIN_PASS}</p>
                    <p>IAM_ADMIN_USER: {process.env.IAM_ADMIN_USER}</p>
                    <p>IAM_CLIENT_ID: {process.env.IAM_CLIENT_ID}</p>
                    <p>IAM_CLIENT_SECRET: {process.env.IAM_CLIENT_SECRET}</p>
                    <p>IAM_REALM: {process.env.IAM_REALM}</p>
                    <p>IAM_CLIENT_SECRET: {process.env.IAM_CLIENT_SECRET}</p>
                    <p>IAM_URL: {process.env.IAM_URL}</p>
                    <p>MAILER_FROM: {process.env.MAILER_FROM}</p>
                    <p>MAILER_URL: {process.env.MAILER_URL}</p>
                    <p>NODE_ENV: {process.env.NODE_ENV}</p>
                    <p>APP_ENV: {process.env.APP_ENV}</p>
                </Content>
            </Page>
        );
    }
}

module.exports = AanmeldPage;
