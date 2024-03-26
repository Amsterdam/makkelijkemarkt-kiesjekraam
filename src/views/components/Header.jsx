import PropTypes from 'prop-types';
import React from 'react';
import {
    Roles,
} from '../../authentication';
import { getRolebasedHomeURL, getTitleForRole } from '../../roles';

const LoginButton = require('./LoginButton');

const Header = ({ user, children, hideLogout, breadcrumbs, role }) => {
    if (!breadcrumbs && role !== Roles.MARKTBEWERKER) {
        breadcrumbs = [
            {
                title: 'Markten',
                url: '/markt',
            },
        ];
    }

    return (
        <header className="Header">
            <div className="Header__top">
                <div className="container">
                    <div className="container__content">
                        <div className="Header__top-container">
                            <a className="Header__logo-link" href={"https://kiesjekraam.makkelijkemarkt.amsterdam.nl"}>
                                <picture className="Header__logo">
                                    <source srcSet="/images/logo-desktop.svg" media="(min-width: 540px)" />
                                    <source srcSet="/images/logo-mobile.svg" media="(min-width: 0)" />
                                    <img srcSet="/images/logo-desktop.svg" alt="…" />
                                </picture>
                            </a>
                            <h1 className="Header__heading">Kies je kraam</h1>
                            <div className="Header__user">
                                {!hideLogout && <LoginButton user={user} />}
                                {user && role !== Roles.MARKTONDERNEMER &&
                                <div>
                                    <p className="Header__user__name">{user.name}</p>
                                    <p className="Header__user__role">{getTitleForRole(role)}</p>
                                </div>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="Header__bottom">
                <div className="container">
                    <div className="container__content">
                        <div className="Header__bottom-container">
                            <div className="Breadcrumbs">
                                {breadcrumbs
                                    ? breadcrumbs.map((link, i) => (
                                          <a className="Breadcrumb" href={link.url} key={i}>
                                              {link.title}
                                              <img
                                                  className="Breadcrumb__icon"
                                                  src="/images/chevron-right.svg"
                                                  alt="Chevron-right"
                                              />
                                          </a>
                                      ))
                                    : null}
                            </div>
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

Header.propTypes = {
    breadcrumbs: PropTypes.arrayOf(PropTypes.object),
    user: PropTypes.object,
    role: PropTypes.string,
    children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]),
    hideLogout: PropTypes.bool,
};

module.exports = Header;
