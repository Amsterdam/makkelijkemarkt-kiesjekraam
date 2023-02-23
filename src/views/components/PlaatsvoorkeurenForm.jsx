import PropTypes from 'prop-types';
import React from 'react';
import { Roles } from '../../authentication'

const { plaatsSort, isVastOfExp, isEb } = require('../../domain-knowledge.ts');
const { getDefaultVoorkeur } = require('../../model/voorkeur.functions');
const MarktplaatsSelect = require('./MarktplaatsSelect');
const Button = require('./Button');
const Form = require('./Form');

class PlaatsvoorkeurenForm extends React.Component {
    propTypes = {
        plaatsvoorkeuren: PropTypes.array.isRequired,
        marktplaatsen: PropTypes.array.isRequired,
        markt: PropTypes.object.isRequired,
        ondernemer: PropTypes.object.isRequired,
        indelingVoorkeur: PropTypes.object,
        plaatsen: PropTypes.array.isRequired,
        role: PropTypes.string,
        sollicitatie: PropTypes.object.isRequired,
        csrfToken: PropTypes.string,
    };

    render() {
        const { markt, ondernemer, marktplaatsen, indelingVoorkeur, role, sollicitatie, csrfToken } = this.props;

        let { plaatsvoorkeuren } = this.props;
        const voorkeur = indelingVoorkeur || getDefaultVoorkeur(sollicitatie);

        // Only Marktondernemers and Marktbewerkers may edit, but only if the ondernemer
        // and doesn`t have a fixed place (and is not coming out of Mercato).
        // In that case the minimum amount of neccesary spots may be chosen here.
        // This applies to SOLL and TVPLZ.
        const minimumPlaatsenDisabled = role === Roles.MARKTMEESTER || isVastOfExp(sollicitatie.status)

        // If minimum plaatsen can be edited, we also need to extend the amount of minimum plaatsen.
        // We expect that 3 is the maximum a SOLL or TVPLZ might need, because it's already hard
        // to get a spot when your minimum is 1.
        let minimumCount = isVastOfExp(sollicitatie.status) ? sollicitatie.vastePlaatsen.length : 3;

        const minimumChecked = i => {
            if (isVastOfExp(sollicitatie.status)) {
                if (sollicitatie.vastePlaatsen.length === i + 1) {
                    return true;
                } else {
                    return false;
                }
            } else if (voorkeur.minimum === i + 1) {
                return true;
            } else {
                return false;
            }
        };

        const defaultCheckedMax = i => {
            if (voorkeur.maximum - voorkeur.minimum === i) {
                return true;
            } else {
                return false;
            }
        };

        const plaatsenDuiding = plaatsen => {
            return plaatsen.length > 1 ? 'plaatsen' : 'plaats';
        };

        const plaatsNummerDuiding = plaatsen => {
            return plaatsen.length > 1 ? 'plaatsnummers' : 'plaatsnummer';
        };

        const isMarktBewerkerEnVph = role === Roles.MARKTBEWERKER && isVastOfExp(sollicitatie.status);
        const maxNumKramen = markt.maxAantalKramenPerOndernemer;

        plaatsvoorkeuren = plaatsvoorkeuren
            .map((plaatsvoorkeur, index) => {
                return {
                    marktId: plaatsvoorkeur.marktId,
                    erkenningsNummer: plaatsvoorkeur.erkenningsNummer,
                    plaatsId: plaatsvoorkeur.plaatsId,
                    priority: plaatsvoorkeur.priority,
                    readonly: false,
                    newItem: false,
                };
            })
            .sort((a, b) => a.priority - b.priority);

        marktplaatsen
            .sort((a, b) => plaatsSort(a, b, 'plaatsId'))
            .map(plaats => {
                plaats.disabled = !!plaatsvoorkeuren.find(entry => entry.plaatsId === plaats.plaatsId);
                return plaats;
            });

        return (
            <Form className="Form Form--PlaatsvoorkeurenForm" csrfToken={csrfToken} decorator="voorkeur-form">
                <input
                    id="erkenningsNummer"
                    type="hidden"
                    name="erkenningsNummer"
                    defaultValue={ondernemer.erkenningsnummer}
                />

                <input id="maxNumKramen" type="hidden" name="maxNumKramen" defaultValue={maxNumKramen} />

                <div className="PlaatsvoorkeurenForm__markt" data-markt-id={markt.id}>
                    <input name="maximum" id="maximum" type="hidden" defaultValue={voorkeur.maximum} />
                    <div
                        className={
                            'Fieldset PlaatsvoorkeurenForm__plaats-count ' +
                            (isMarktBewerkerEnVph ? 'Fieldset--highlighted' : null)
                        }
                    >
                        {maxNumKramen ? (
                            <p className="Fieldset__highlight-text">
                                <i>Voor deze markt geldt een maximum van {maxNumKramen} plaatsen per ondernemer.</i>
                            </p>
                        ) : null}
                        <h2 className="Fieldset__header">
                            {isVastOfExp(sollicitatie.status)
                                ? `Uw vaste ${plaatsenDuiding(sollicitatie.vastePlaatsen)}`
                                : 'Aantal plaatsen'}
                        </h2>
                        <span className="Fieldset__sub-header">
                            {isVastOfExp(sollicitatie.status) ? (
                                `${plaatsNummerDuiding(sollicitatie.vastePlaatsen)}: ${sollicitatie.vastePlaatsen.join(
                                    ', ',
                                )}`
                            ) : (
                                <span>
                                    Hoeveel plaatsen hebt u <strong>echt nodig</strong>?
                                </span>
                            )}
                        </span>

                        <div className="PlaatsvoorkeurenForm__plaats-count__wrapper">
                            {Array.from(new Array(minimumCount)).map((r, i) => (
                                <React.Fragment key={i}>
                                    <input
                                        type="radio"
                                        id={`default-count-${i + 1}`}
                                        value={`${i + 1}`}
                                        data-val={`${i + 1}`}
                                        name="minimum"
                                        disabled={minimumPlaatsenDisabled}
                                        {...{ defaultChecked: minimumChecked(i) }}
                                    />
                                    <label htmlFor={`default-count-${i + 1}`}>{i + 1}</label>
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                    <div className="Fieldset PlaatsvoorkeurenForm__plaats-count extra">
                        <h2 className="Fieldset__header">Extra plaatsen</h2>
                        <span className="Fieldset__sub-header">
                            Hoeveel <strong>extra</strong> plaatsen wilt u daar nog bij - als er genoeg plek is?
                        </span>
                        <div className="PlaatsvoorkeurenForm__plaats-count__wrapper extra">
                            {['geen', '1', '2'].map((r, i) => (
                                <React.Fragment key={i}>
                                    <input
                                        type="radio"
                                        id={`extra-count-${i}`}
                                        value={`${i}`}
                                        name="extra-count"
                                        disabled={role === Roles.MARKTMEESTER}
                                        {...{ defaultChecked: defaultCheckedMax(i) }}
                                        data-test={`extra-count-${i}`}
                                    />
                                    <label htmlFor={`extra-count-${i}`}>
                                        {i !== 0 ? '+' : ''}
                                        {r}
                                    </label>
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                    <div className="Fieldset">

                        <div
                            className="PlaatsvoorkeurenForm__prototype"
                            data-plaatsvoorkeur-count={minimumCount}
                            data-markt-id={markt.id}
                            data-decorator="plaatsvoorkeur-prototype"
                            data-used-plaatsen={`p=${plaatsvoorkeuren.map(entry => entry.plaatsId).join('&p=')}`}
                            data-select-base-id={plaatsvoorkeuren.length}
                            data-max-uitbreidingen={1}
                        >
                            <div className="PlaatsvoorkeurenForm__list-item" id="plaatsvoorkeuren-list-item">
                                <h4 className="PlaatsvoorkeurenForm__list-item__heading Fieldset__sub-header">
                                    {isEb(sollicitatie.status) ? "Uitbreidingsvoorkeur" : "Plaatsvoorkeur"} toevoegen
                                </h4>
                                <div className="well well--small">
                                    <span className="PlaatsvoorkeurenForm__list-item__label">Kies een marktplaats (max. 6)</span>
                                    <div className={`PlaatsvoorkeurenForm__list-item__wrapper`}>
                                        <input
                                            type="hidden"
                                            name={`plaatsvoorkeuren[${plaatsvoorkeuren.length + 1}][marktId]`}
                                            defaultValue={markt.id}
                                        />
                                        <input
                                            type="hidden"
                                            name={`plaatsvoorkeuren[${plaatsvoorkeuren.length + 1}][priority]`}
                                            defaultValue={2}
                                        />
                                        <MarktplaatsSelect
                                            name={`plaatsvoorkeuren[${plaatsvoorkeuren.length + 1}][plaatsId]`}
                                            id={`voorkeur-${plaatsvoorkeuren.length + 1}`}
                                            data={marktplaatsen}
                                            optional={true}
                                            readonly={plaatsvoorkeuren.length >= 6 || role === Roles.MARKTMEESTER}
                                        />
                                        <div className="PlaatsvoorkeurenForm__list-item__extra PlaatsvoorkeurenForm__list-item__min-extra" />
                                        <div className="PlaatsvoorkeurenForm__list-item__extra PlaatsvoorkeurenForm__list-item__optional" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <h4 className="Fieldset__header">Prioriteit voorkeur wijzigen</h4>
                        <div className="PlaatsvoorkeurenForm__list">
                            {role === Roles.MARKTMEESTER ? (
                                <div className="PlaatsvoorkeurenForm__list--disabled" />
                            ) : null }
                            {plaatsvoorkeuren.map((entry, index) => (
                                <div className="Draggable-list-item" id="plaatsvoorkeuren-list-item" key={entry.id}>
                                    <div className="Draggable-list-item__handle">
                                        <div className="Draggable-list-item__handle__bar" />
                                        <div className="Draggable-list-item__handle__bar" />
                                    </div>
                                    <div className="Draggable-list-item__left">
                                        <span className="Draggable-list-item__label" data-test="Draggable-list-item__label">
                                            <strong>{entry.plaatsId}</strong>
                                        </span>
                                    </div>
                                    <input
                                        type="hidden"
                                        name={`plaatsvoorkeuren[${index}][marktId]`}
                                        defaultValue={entry.marktId}
                                    />
                                    <input
                                        type="hidden"
                                        name={`plaatsvoorkeuren[${index}][priority]`}
                                        defaultValue={plaatsvoorkeuren.length - index}
                                    />
                                    <input
                                        type="hidden"
                                        name={`plaatsvoorkeuren[${index}][plaatsId]`}
                                        value={entry.plaatsId}
                                    />
                                    {(role === Roles.MARKTONDERNEMER || role === Roles.MARKTBEWERKER) ? (
                                        <a href="#" data-handler="remove-voorkeur" className="Draggable-list-item__right">
                                            <span className="Draggable-list-item__delete" data-test="Draggable-list-item__delete" />
                                        </a>
                                    ) : null}
                                </div>
                            ))}
                        </div>
                        <div className="Icon-line">
                            <img className="Icon-line__icon" src="/images/draggable.svg" alt="Unchecked" />
                            <p className="Icon-line__text">
                                Verander de volgorde van de plaatsnummers door ze op de juiste plaats te slepen.
                            </p>
                        </div>

                        {/* Dit veld wordt alleen getoond aan dagplaatshouders (SOLL en TVPLZ) */}
                        {!isVastOfExp(sollicitatie.status) ? (
                            <div className={`Fieldset ${isMarktBewerkerEnVph ? 'Fieldset--highlighted' : null}`}>
                                <h2 className="Fieldset__header">Automatisch indelen?</h2>
                                <p>
                                    <i>
                                        Zijn uw voorkeursplekken niet meer vrij? Met deze optie aan wordt geprobeerd u
                                        op andere vrije plaatsen in te delen.
                                    </i>
                                </p>
                                <p className="InputField InputField--checkbox">
                                    <input
                                        id="anywhere"
                                        type="checkbox"
                                        name="anywhere"
                                        defaultChecked={voorkeur.anywhere}
                                        disabled={role === Roles.MARKTMEESTER}
                                        data-test="anywhere"
                                        />
                                    <label htmlFor="anywhere">
                                        <span>Ja, ook als mijn voorkeuren niet vrij zijn wil ik ingedeeld worden.</span>
                                    </label>
                                </p>
                            </div>
                        ) : null}
                    </div>

                    <p className="InputField InputField--submit" id="bottom-buttons">
                        <Button
                            label="Terug"
                            href={
                                role === Roles.MARKTONDERNEMER
                                    ? `/markt-detail/${markt.id}#plaatsvoorkeuren`
                                    : `/profile/${ondernemer.erkenningsnummer}`
                            }
                            type="tertiary"
                        />
                        {(role === Roles.MARKTONDERNEMER || role === Roles.MARKTBEWERKER) ? (
                            <Button
                                label="Opslaan"
                                href={
                                    role === Roles.MARKTONDERNEMER
                                        ? `/markt-detail/${markt.id}?error=plaatsvoorkeuren-saved#plaatsvoorkeuren`
                                        : `/profile/${ondernemer.erkenningsnummer}?error=plaatsvoorkeuren-saved#plaatsvoorkeuren`
                                }
                                type="secondary"
                            />
                        ) : null}

                    </p>
                </div>
            </Form>
        );
    }
}

module.exports = PlaatsvoorkeurenForm;
