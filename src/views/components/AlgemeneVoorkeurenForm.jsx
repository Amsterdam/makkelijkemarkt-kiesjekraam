import Form from './Form';
import {
    getDefaultVoorkeur,
} from '../../model/voorkeur.functions';
import {
    InfoCircle
} from './svg';
import ModalPopup from './ModalPopup';
import PropTypes from 'prop-types';
import React from 'react';
import SollicitatieSpecs from './SollicitatieSpecs';
import {
    yyyyMmDdtoDDMMYYYY,
} from '../../util.ts';
import { Roles } from '../../authentication'

class AlgemeneVoorkeurenForm extends React.Component {
    propTypes = {
        marktId: PropTypes.string,
        marktDate: PropTypes.string,
        ondernemer: PropTypes.object.isRequired,
        markt: PropTypes.object,
        voorkeur: PropTypes.array,
        branches: PropTypes.array.isRequired,
        next: PropTypes.string,
        query: PropTypes.string,
        role: PropTypes.string,
        csrfToken: PropTypes.string,
    };

    render() {
        const { branches, ondernemer, markt, marktId, marktDate, role, csrfToken } = this.props;
        const sollicitatie = ondernemer.sollicitaties.find(soll => soll.markt.id === markt.id);
        const voorkeur = this.props.voorkeur || getDefaultVoorkeur(sollicitatie);

        if (voorkeur.absentFrom) {
            voorkeur.absentFrom = yyyyMmDdtoDDMMYYYY(voorkeur.absentFrom);
        }

        if (voorkeur.absentUntil) {
            voorkeur.absentUntil = yyyyMmDdtoDDMMYYYY(voorkeur.absentUntil);
        }

        return (
            <Form csrfToken={csrfToken} className="Form--AlgemenevoorkeurenForm">
                {role === Roles.MARKTONDERNEMER ? <SollicitatieSpecs sollicitatie={sollicitatie} markt={markt} /> : null}
                <h1 className="Heading Heading--intro">Marktprofiel {markt.naam}</h1>
                <div className="well well--max-width">
                    <div className="Fieldset">
                        <h2 className="Fieldset__header">Wat voor koopwaar verkoopt u?</h2>
                        <div className="InputField">
                            <div className="Select__wrapper">
                                <select id="brancheId" name="brancheId" className="Select" required>
                                    {/* We show an empty option if the ondernemer hasn't chosen a branche yet */
                                        voorkeur.brancheId ? null : <option />
                                    }

                                    {/* We need to send the brancheId to the API, but disabling
                                    removes the brancheId from the POST params. Therefore show just the
                                    chosen one for non marktondernemers or marktbewerkers. 
                                     */}
                                    {(role === Roles.MARKTONDERNEMER || role === Roles.MARKTBEWERKER) ? (
                                        branches.map(branche => (
                                            <option
                                                key={branche.brancheId}
                                                value={branche.brancheId}
                                                selected={branche.brancheId === voorkeur.brancheId}
                                            >
                                                {branche.description}
                                            </option>
                                        ))       
                                    ) : 
                                        <option
                                            value={voorkeur.brancheId}
                                            selected={voorkeur.brancheId}
                                        >
                                            {voorkeur.brancheId}
                                        </option>
                                    }
                                
                                </select>{' '}
                            </div>
                        </div>
                    </div>
                    <div className="Fieldset">
                        <h2 className="Fieldset__header">
                            Hebt u een bakplaats nodig?
                            <BakTypeModalPopup />
                        </h2>
                        <div className="InputField">
                            <div className="Select__wrapper">
                            <select id="bakType" name="bakType" className='Select' disabled={role === Roles.MARKTMEESTER}>
                                <option selected={voorkeur.bakType === 'geen'} value="geen">Nee</option>
                                <option selected={voorkeur.bakType === 'bak-licht'} value="bak-licht">Ja, Bakplaats licht (zonder open vuur en/of frituur)</option>
                                <option selected={voorkeur.bakType === 'bak'} value="bak">Ja, Bakplaats (inclusief frituren)</option>
                            </select>
                            </div>
                        </div>
                    </div>
                    <div className="Fieldset">
                        <h2 className="Fieldset__header">Wilt u met eigen materiaal staan?</h2>
                        <p className="InputField InputField--checkbox">
                            <input
                                id="inrichting"
                                type="checkbox"
                                name="inrichting"
                                defaultValue="eigen-materieel"
                                defaultChecked={voorkeur.inrichting === 'eigen-materieel'}
                                disabled={role === Roles.MARKTMEESTER}
                            />
                            <label htmlFor="inrichting">Ja, ik kom met een eigen verkoopwagen/eigen materiaal.</label>
                        </p>
                    </div>
                    {(role === Roles.MARKTBEWERKER || role === Roles.MARKTMEESTER) ? (
                        <div className={`Fieldset Fieldset--highlighted`}>
                            <h2 className="Fieldset__header">Langdurige afwezigheid</h2>
                            <p className="InputField  InputField--text">
                                <label className="Label" htmlFor="absentFrom">
                                    Afwezig vanaf (dd-mm-yyyy):{' '}
                                </label>
                                <input
                                    id="absentFrom"
                                    type="text"
                                    name="absentFrom"
                                    placeholder="dd-mm-yyyy"
                                    className="Input Input--medium"
                                    value={voorkeur.absentFrom}
                                />
                            </p>
                            <p className="InputField InputField--text">
                                <label className="Label" htmlFor="absentUntil">
                                    Afwezig tot en met (dd-mm-yyyy):
                                </label>
                                <input
                                    id="absentUntil"
                                    type="text"
                                    name="absentUntil"
                                    placeholder="dd-mm-yyyy"
                                    className="Input Input--medium"
                                    value={voorkeur.absentUntil}
                                />
                            </p>
                        </div>
                    ) : null}
                </div>

                <div className="Fieldset">
                    <p className="InputField InputField--submit">
                        <input
                            id="erkenningsNummer"
                            type="hidden"
                            name="erkenningsNummer"
                            defaultValue={ondernemer.erkenningsnummer}
                        />
                        <input type="hidden" name="marktId" defaultValue={marktId} />
                        <input type="hidden" name="marktDate" defaultValue={marktDate} />
                        <input type="hidden" name="anywhere" defaultValue={voorkeur.anywhere} />
                        <input type="hidden" name="minimum" defaultValue={voorkeur.minimum} />
                        <input type="hidden" name="maximum" defaultValue={voorkeur.maximum} />
                        <a
                            className="Button Button--tertiary"
                            href={`${
                                (role === Roles.MARKTMEESTER || role === Roles.MARKTBEWERKER)
                                    ? `/profile/${ondernemer.erkenningsnummer}`
                                    : `/markt-detail/${markt.id}#marktprofiel`
                            }`}
                        >
                            Terug
                        </a>
                        <button
                            className="Button Button--secondary"
                            type="submit"
                            name="next"
                            value={
                                (role === Roles.MARKTBEWERKER || role === Roles.MARKTMEESTER) 
                                ?  `/profile/${ondernemer.erkenningsnummer}?error=algemene-voorkeuren-saved#marktprofiel`
                                : `/markt-detail/${markt.id}?error=algemene-voorkeuren-saved#marktprofiel`
                            }
                        >
                            Opslaan
                        </button>
                 
                    </p>
                </div>
            </Form>
        );
    }
}

const BakTypeModalPopup = () => {
    const options = [
        {
            header: "Bakplaats licht",
            text: `Marktplaats waarop het is toegestaan om uw product te
            bereiden met enkel gebruik van een elektrisch
            verwarmingstoestel, bak- en/of kookinstallatie zonder
            open vuur en/of frituur.`,
        },
        {
            header: "Bakplaats",
            text: `Marktplaats waarop het is toegestaan om uw product te
            bereiden met gebruik van een verwarmings- toestel, bak-
            en/of kookinstallatie inclusief frituren.`,
        },
    ];

    return (
        <ModalPopup options={options}>
            <span>
                <InfoCircle />
            </span>
        </ModalPopup>
    );
};

module.exports = AlgemeneVoorkeurenForm;
