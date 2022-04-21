import {
    toDate,
    WEEK_DAYS_SHORT,
} from '../../util.ts';
import Alert from './Alert';
import {
    EMPTY_BRANCH,
} from '../../makkelijkemarkt-api';
import Form from './Form';
import PropTypes from 'prop-types';
import React from 'react';
import {
    Roles,
} from '../../authentication';
import SollicitatieSpecs from './SollicitatieSpecs';

class AanwezigheidsForm extends React.Component {
    propTypes = {
        ondernemer: PropTypes.object.isRequired,
        aanmeldingenPerMarktPerWeek: PropTypes.array,
        sollicitaties: PropTypes.array.isRequired,
        query: PropTypes.string,
        role: PropTypes.string,
        csrfToken: PropTypes.string,
        voorkeuren: PropTypes.array.isRequired,
    };

    render() {
        const { aanmeldingenPerMarktPerWeek = [], csrfToken, ondernemer, role, sollicitaties, voorkeuren } = this.props;

        // Wordt in de HTML gebruikt om de `rsvp` <input>s te nummeren.
        let index = -1;

        const getVoorkeurForMarkt = marktId => {
            return voorkeuren.find(voorkeur => {
                return voorkeur.marktId === marktId.toString();
            });
        };

        const getVoorkeurenLink = markt => {
            let link;
            role === Roles.MARKTMEESTER
                ? (link = `/ondernemer/${ondernemer.erkenningsnummer}/algemene-voorkeuren/${markt.id}/`)
                : (link = `/algemene-voorkeuren/${markt.id}/`);
            return link;
        };

        const hasNoBranche = markt => {
            const voorkeur = getVoorkeurForMarkt(markt.id);
            return !voorkeur || !voorkeur.branches || voorkeur.branches[0] === EMPTY_BRANCH;
        };

        return (
            <Form className="AanwezigheidsForm" decorator="" csrfToken={csrfToken}>
                <input
                    id="erkenningsNummer"
                    name="erkenningsNummer"
                    defaultValue={ondernemer.erkenningsnummer}
                    type="hidden"
                />

                {aanmeldingenPerMarktPerWeek.map(({ markt, aanmeldingenPerWeek }) => (
                    <div className="markt" key="{markt.id}">
                        <h2 className="Heading Heading--intro">
                            {markt.naam} <SollicitatieSpecs sollicitatie={sollicitaties[markt.id]} />
                        </h2>
                        {hasNoBranche(markt) ? (
                            <Alert type="error" inline={true} fullwidth={true}>
                                <span>
                                    U hebt uw <strong>koopwaar</strong> nog niet doorgegeven in het{' '}
                                    <a href={getVoorkeurenLink(markt)}>marktprofiel</a>, daarom kunt u zich niet
                                    aanmelden voor deze markt.
                                </span>
                            </Alert>
                        ) : null}
                        {aanmeldingenPerWeek.map((week, i) => (
                            <div className="week" key="{i}">
                                <h4>{i === 0 ? 'Deze week' : 'Volgende week'}</h4>
                                {[0, 1, 2, 3, 4, 5, 6].map(day =>
                                    day in week ? (
                                        <span className="day" key={++index}>
                                            <input
                                                type="hidden"
                                                name={`rsvp[${index}][marktId]`}
                                                disabled={week[day].isInThePast}
                                                defaultValue={markt.id}
                                            />
                                            <input
                                                type="hidden"
                                                name={`rsvp[${index}][marktDate]`}
                                                disabled={week[day].isInThePast}
                                                defaultValue={toDate(week[day].date)}
                                            />

                                            <input
                                                type="checkbox"
                                                id={`rsvp-${index}`}
                                                name={`rsvp[${index}][attending]`}
                                                disabled={week[day].isInThePast || hasNoBranche(markt)}
                                                defaultValue="1"
                                                defaultChecked={week[day].attending}
                                            />
                                            <label htmlFor={`rsvp-${index}`}>
                                                <strong>{WEEK_DAYS_SHORT[day]}</strong>
                                            </label>
                                        </span>
                                    ) : (
                                        <span className="day" key={++index}>
                                            <input
                                                disabled={true}
                                                id={`rsvp-${index}`}
                                                type="checkbox"
                                                defaultValue="0"
                                            />
                                            <label htmlFor={`rsvp-${index}`}>
                                                <strong>{WEEK_DAYS_SHORT[day]}</strong>
                                            </label>
                                        </span>
                                    ),
                                )}
                            </div>
                        ))}
                    </div>
                ))}

                <p className="InputField InputField--submit">
                    <a
                        className="Button Button--tertiary"
                        href={`${role === 'marktmeester' ? `/profile/${ondernemer.erkenningsnummer}` : `/dashboard`}`}
                    >
                        Terug
                    </a>
                    <button
                        className="Button Button--secondary"
                        type="submit"
                        name="next"
                        value={`${
                            role === 'marktmeester'
                                ? `/profile/${ondernemer.erkenningsnummer}?error=aanwezigheid-saved`
                                : `/dashboard?error=aanwezigheid-saved`
                        }`}
                    >
                        Opslaan
                    </button>
                </p>
            </Form>
        );
    }
}

module.exports = AanwezigheidsForm;
