import { toDate, WEEK_DAYS_SHORT } from '../../util.ts';
import { isVast } from '../../domain-knowledge';
import Alert from './Alert';
import { EMPTY_BRANCH } from '../../makkelijkemarkt-api';
import Form from './Form';
import PropTypes from 'prop-types';
import React from 'react';
import { Roles } from '../../authentication';
import SollicitatieSpecs from './SollicitatieSpecs';

class AanwezigheidsForm extends React.Component {
    propTypes = {
        ondernemer: PropTypes.object.isRequired,
        aanmeldingenPerMarktPerWeek: PropTypes.array,
        rsvpPattern: PropTypes.array,
        sollicitaties: PropTypes.array.isRequired,
        query: PropTypes.string,
        role: PropTypes.string,
        csrfToken: PropTypes.string,
        voorkeuren: PropTypes.array.isRequired,
    };

    render() {
        const {
            aanmeldingenPerMarktPerWeek = [],
            rsvpPattern,
            csrfToken,
            ondernemer,
            role,
            sollicitaties,
            voorkeuren,
        } = this.props;

        // Wordt in de HTML gebruikt om de `rsvp` <input>s te nummeren.
        let dayIndex = -1;

        const getVoorkeurForMarkt = (marktId) => {
            return voorkeuren.find((voorkeur) => {
                return voorkeur.marktId === marktId.toString();
            });
        };

        const getVoorkeurenLink = (markt) => {
            let link;
            role === Roles.MARKTMEESTER
                ? (link = `/ondernemer/${ondernemer.erkenningsnummer}/algemene-voorkeuren/${markt.id}/`)
                : (link = `/algemene-voorkeuren/${markt.id}/`);
            return link;
        };

        const hasNoBranche = (markt) => {
            const voorkeur = getVoorkeurForMarkt(markt.id);
            return !voorkeur || !voorkeur.branches || voorkeur.branches[0] === EMPTY_BRANCH;
        };

        const solStatus = (markt, sollicitaties) => {
            const solMatchedByMarkt = sollicitaties.filter((solicitatie) => {
                return solicitatie.markt.id === markt.id;
            })[0];
            return solMatchedByMarkt.status;
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
                            <div className="week" key={`markt-${markt.id}-week-${i}`}>
                                <h4>{i === 0 ? 'Deze week' : 'Volgende week'}</h4>
                                {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                                    dayIndex++;
                                    return day in week ? (
                                        <span className="day" key={`markt-${markt.id}-week-${week}-day-${day}`}>
                                            {/* Old values sent as well so difference can be stored */}
                                            <input
                                                type="hidden"
                                                name={`previousRsvpData[${dayIndex}][marktId]`}
                                                disabled={week[day].isInThePast}
                                                defaultValue={JSON.stringify(markt.id)}
                                            />
                                            <input
                                                type="hidden"
                                                name={`previousRsvpData[${dayIndex}][marktDate]`}
                                                disabled={week[day].isInThePast}
                                                defaultValue={toDate(week[day].date)}
                                            />
                                            <input
                                                type="hidden"
                                                name={`previousRsvpData[${dayIndex}][attending]`}
                                                disabled={
                                                    week[day].isInThePast || hasNoBranche(markt) || !week[day].attending
                                                }
                                                defaultValue={JSON.stringify(week[day].attending ? 1 : undefined)}
                                            />
                                            {/* End of old values */}

                                            <input
                                                type="hidden"
                                                name={`rsvp[${dayIndex}][marktId]`}
                                                disabled={week[day].isInThePast}
                                                defaultValue={markt.id}
                                            />
                                            <input
                                                type="hidden"
                                                name={`rsvp[${dayIndex}][marktDate]`}
                                                disabled={week[day].isInThePast}
                                                defaultValue={toDate(week[day].date)}
                                            />

                                            <input
                                                type="checkbox"
                                                id={`rsvp-${dayIndex}`}
                                                name={`rsvp[${dayIndex}][attending]`}
                                                disabled={week[day].isInThePast || hasNoBranche(markt)}
                                                defaultValue="1"
                                                defaultChecked={week[day].attending}
                                            />
                                            <label htmlFor={`rsvp-${dayIndex}`}>
                                                <strong>{WEEK_DAYS_SHORT[day]}</strong>
                                            </label>
                                        </span>
                                    ) : (
                                        <span className="day" key={`markt-${markt.id}-week-${week}-day-${day}`}>
                                            <input
                                                disabled={true}
                                                id={`rsvp-${dayIndex}`}
                                                type="checkbox"
                                                defaultValue="0"
                                            />
                                            <label htmlFor={`rsvp-${dayIndex}`}>
                                                <strong>{WEEK_DAYS_SHORT[day]}</strong>
                                            </label>
                                        </span>
                                    );
                                })}
                            </div>
                        ))}
                        {rsvpPattern[markt.id] == undefined ? (
                            <Alert type="error" inline={true} fullwidth={true}>
                                <span>
                                    U heeft nog geen <strong>aanwezigheidspatroon</strong> ingevuld. Het opslaan hiervan
                                    heeft effect op uw aanwezigheid.
                                </span>
                            </Alert>
                        ) : null}
                        <div className="week" key={`rsvpPattern-markt-${markt.id}`}>
                            <h4>Aanwezigheidspatroon</h4>
                            <input
                                type="hidden"
                                name={`previousRsvpPattern[${markt.id}][markt]`}
                                disabled={false}
                                defaultValue={JSON.stringify(markt.id)}
                            />
                            <input
                                type="hidden"
                                class=""
                                name={`rsvpPattern[${markt.id}][markt]`}
                                disabled={false}
                                defaultValue={markt.id}
                            />
                            {['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map(
                                (day, dayNr) => {
                                    return (
                                        <span className="day" key={`day-${dayNr}`}>
                                            <input
                                                type="hidden"
                                                name={`previousRsvpPattern[${markt.id}][${day}]`}
                                                disabled={
                                                    hasNoBranche(markt) ||
                                                    !markt.marktDagen.includes(WEEK_DAYS_SHORT[dayNr]) ||
                                                    (rsvpPattern[markt.id] && !rsvpPattern[markt.id][day])
                                                }
                                                defaultValue={JSON.stringify(
                                                    rsvpPattern[markt.id] ? rsvpPattern[markt.id][day] : undefined,
                                                )}
                                            />
                                            <input
                                                type="checkbox"
                                                id={`rsvpPattern-${markt.id}-${day}`}
                                                name={`rsvpPattern[${markt.id}][${day}]`}
                                                disabled={
                                                    hasNoBranche(markt) ||
                                                    !markt.marktDagen.includes(WEEK_DAYS_SHORT[dayNr])
                                                }
                                                defaultValue={true}
                                                defaultChecked={
                                                    rsvpPattern[markt.id]
                                                        ? rsvpPattern[markt.id][day]
                                                        : isVast(solStatus(markt, ondernemer.sollicitaties)) &&
                                                          markt.marktDagen.includes(WEEK_DAYS_SHORT[dayNr])
                                                }
                                            />
                                            <label htmlFor={`rsvpPattern-${markt.id}-${day}`}>
                                                <strong>{WEEK_DAYS_SHORT[dayNr]}</strong>
                                            </label>
                                        </span>
                                    );
                                },
                            )}
                        </div>
                    </div>
                ))}

                <p className="InputField InputField--submit">
                    <a
                        className="Button Button--tertiary"
                        href={role === 'marktmeester' ? `/profile/${ondernemer.erkenningsnummer}` : '/dashboard'}
                    >
                        Terug
                    </a>
                    <button
                        className="Button Button--secondary"
                        type="submit"
                        name="next"
                        value={
                            role === 'marktmeester'
                                ? `/ondernemer/${ondernemer.erkenningsnummer}/aanwezigheid?error=aanwezigheid-saved`
                                : '/aanwezigheid?error=aanwezigheid-saved'
                        }
                    >
                        Opslaan
                    </button>
                </p>
            </Form>
        );
    }
}

module.exports = AanwezigheidsForm;
