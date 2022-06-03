import PropTypes from 'prop-types';
import React from 'react';

const IndelingsLegenda = ({ branches, marktplaatsen, ondernemers, aanmeldingen, toewijzingen }) => {
    const relevantBranches = getAllBranchesForLegend(branches, marktplaatsen);
    const showToewijzingen = !!toewijzingen.length;
    const _indelingenPerBranche = showToewijzingen
        ? countToewijzingenPerBranche(branches, ondernemers, toewijzingen)
        : {};
    const bakCount = countBak(ondernemers, toewijzingen);
    const indelingenPerBranche = {..._indelingenPerBranche, ...bakCount}
    return (
        <div className="IndelingsLegenda">
            <table>
                <thead>
                    <tr>
                        <th className="nr">Nr.</th>
                        <th>Beschrijving</th>
                        <th>Verplicht</th>
                        <th>Maximum</th>
                        {showToewijzingen && <th>Toegewezen</th>}
                    </tr>
                </thead>

                <tbody>
                    {relevantBranches.map((branche, i) => (
                        <tr key={i}>
                            <td
                                className={`autoColor ${branche.brancheId}`}
                                style={{ backgroundColor: branche.color || 'transparent' }}
                            >
                                {branche.brancheId.substring(0, 3)}
                            </td>
                            <td>{branche.description}</td>
                            <td>{branche.verplicht ? "x": ""}</td>
                            <td className={!branche.maximumPlaatsen ? 'nvt' : ''}>{branche.maximumPlaatsen || '—'}</td>
                            {showToewijzingen && <td>{indelingenPerBranche[branche.brancheId] || 0}</td>}
                        </tr>
                    ))}
                    <tr key="evi-stand">
                        <td className="autoColor evi background-light">evi</td>
                        <td>Eigen verkoopinrichting plaats</td>
                        <td />
                        <td />
                        {showToewijzingen && <td />}
                    </tr>
                    <tr key="missing-voorkeur">
                        <td className="autoColor missing-voorkeur background-light"></td>
                        <td>Ondernemer heeft geen voorkeuren</td>
                        <td />
                        <td />
                        <td />
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

IndelingsLegenda.propTypes = {
    branches: PropTypes.array.isRequired,
    marktplaatsen: PropTypes.array.isRequired,
    ondernemers: PropTypes.array.isRequired,
    aanmeldingen: PropTypes.array,
    toewijzingen: PropTypes.array,
};

const _isRelevantBrancheForLegend = (marktplaatsen, branche) => {
    const brancheId         = branche.brancheId;
    if (branche.brancheId === 'bak' || branche.brancheId === 'bak-licht'){
        return true;
    }
    if(branche.verplicht === true){
        return true;
    }
    if(branche.maximumPlaatsen !== undefined){
        return true
    }
    const pl = marktplaatsen.find(({ branches }) =>
        branches && branches.includes(brancheId)
    );
    if(pl !== undefined){
        return true;
    }
    return false;
};

const getAllBranchesForLegend = (allBranches, marktplaatsen) => {
    return allBranches
        .reduce((result, branche) => {
            if (!_isRelevantBrancheForLegend(marktplaatsen, branche)) {
                return result;
            }
            return result.concat(branche);
        }, [])
        .sort((a, b) =>
            // `bak` moet bovenaan de lijst staan in de legenda. Bakken is niet echt
            // een branche, maar een toevoeging op een branche. In de indeling wordt
            // dit per plaats aangeduid met een driehoekje linksboven in de branchekleur
            // van een plaats.
            b.brancheId !== 'bak' ? String(a.description).localeCompare(b.description, { sensitivity: 'base' }) : 1,
        );
};

const countBak = (ondernemers, toewijzingen) => {
    return toewijzingen.reduce((result, toewijzing) => {
        const ondernemer =
            toewijzing.ondernemer ||
            ondernemers.find(({ erkenningsNummer }) => erkenningsNummer === toewijzing.erkenningsNummer);
        if ( !ondernemer || !ondernemer.voorkeur) {
            return result;
        }
        if(["bak", "bak-licht"].includes(ondernemer.voorkeur.bakType)){
            result[ondernemer.voorkeur.bakType] += toewijzing.plaatsen.length;
            return result;
        }
        return result;
    }, {"bak": 0, "bak-licht": 0});
}

const countToewijzingenPerBranche = (allBranches, ondernemers, toewijzingen) => {
    return toewijzingen.reduce((result, toewijzing) => {
        // Als `IndelingslijstPage` wordt aangeroepen om een echt gedraaide indeling weer
        // te geven, dan worden de toewijzingen uit de database gehaald. Deze worden hierbij
        // niet verrijkt met de gegevens van de ondernemer (dit gebeurd bij een concept indeling
        // wel). Haal de ondernemergegevens in dit geval uit de `ondernemers` array.
        const ondernemer =
            toewijzing.ondernemer ||
            ondernemers.find(({ erkenningsNummer }) => erkenningsNummer === toewijzing.erkenningsNummer);

        if ( !ondernemer || !ondernemer.voorkeur || !ondernemer.voorkeur.branches) {
            return result;
        }

        return ondernemer.voorkeur.branches.reduce((_result, brancheId) => {
            _result[brancheId] = (_result[brancheId] || 0) + toewijzing.plaatsen.length;
            return _result;
        }, result);
    }, {});
};

export default IndelingsLegenda;
