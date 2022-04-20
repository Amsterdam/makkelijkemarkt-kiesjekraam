const HeaderTitleButton = require('./HeaderTitleButton');
const PropTypes = require('prop-types');
const React = require('react');
const { arrayToObject } = require('../../util.ts');

const OndernemerMarktAlgVoorkeuren = ({ markt, voorkeur, branches }) => {
    const blockUrl = `../../algemene-voorkeuren/${markt.id}/`;
    const branchesObj = arrayToObject(branches, 'brancheId');

    return (
        <div className="OndernemerMarktAlgVoorkeuren background-link-parent" id="marktprofiel">
            <a href={blockUrl} className="background-link" />
            <HeaderTitleButton title="Marktprofiel" url={blockUrl} />
            <div className="well">
                {voorkeur && branchesObj[voorkeur.brancheId] ? (
                    <dl>
                        <dt>Branche</dt>
                        <dd>{voorkeur.brancheId ? branchesObj[voorkeur.brancheId].description : 'geen'}</dd>
                        <dt>Bakplaats nodig?</dt>
                        <dd>{voorkeur.parentBrancheId ? voorkeur.parentBrancheId : 'geen'}</dd>
                        <dt>Verkoopwagen / eigen materiaal?</dt>
                        <dd>{voorkeur.inrichting ? voorkeur.inrichting : 'geen'}</dd>
                    </dl>
                ) : (
                    <p>
                        <strong>
                            Vul uw <u>marktprofiel</u> in.
                        </strong>
                    </p>
                )}
                <span>
                    Bij de indeling houden wij naast de anciënniteit rekening met voorrang op brancheplaatsen,
                    bakplaatsen en plaatsen voor eigen materiaal en verkoopwagens.
                </span>
            </div>
        </div>
    );
};

OndernemerMarktAlgVoorkeuren.propTypes = {
    markt: PropTypes.object.isRequired,
    branches: PropTypes.object.isRequired,
    voorkeur: PropTypes.object,
};

module.exports = OndernemerMarktAlgVoorkeuren;
