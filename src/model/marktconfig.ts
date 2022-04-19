import * as path from 'path';
import { readJSON } from '../util';
import SCHEMAS from './markt-config.model.js';

const CONFIG_DIR = path.resolve(__dirname, '../../config/markt');
const CONFIG_PROPERTIES = ['locaties', 'markt', 'branches', 'geografie', 'paginas'];
const INDEX = {
    obstakelTypes: readJSON(`${CONFIG_DIR}/obstakeltypes.json`),
    plaatsEigenschappen: readJSON(`${CONFIG_DIR}/plaatseigenschappen.json`),
};

export class MarktConfig {
    public id!: number;
    public marktAfkorting: string;
    public createdBy: number;
    public createdAt!: Date;
    public title!: string;
    public data!: object;

    public static mergeBranches(allBranches, marktBranches) {
        return this._mergeBranches(allBranches, marktBranches);
    }

    public static homogenizeData(data) {
        return this._homogenizeData(data);
    }

    // Het kan nl zo zijn dat dit exact dezelfde config data is, maar dat enkel
    // de sortering gewijzigd is. We proberen de data zoveel mogelijk homogeen te
    // maken zodat de kans het grootst is dat er een match gemaakt kan worden met
    // de meest recente data in de database. Is er een match, dan wordt deze config
    // niet opgeslagen.
    private static _homogenizeData(data) {
        const branches = (data.branches || []).sort((a, b) => {
            return a.brancheId.localeCompare(b.brancheId);
        });

        const geografie = { ...(data.geografie || {}) };
        geografie.obstakels = (geografie.obstakels || []).slice();
        geografie.obstakels.sort((a, b) => {
            return Number(a.kraamA) - Number(b.kraamA) || Number(a.kraamB) - Number(b.kraamB);
        });

        const locaties = (data.locaties || []).sort((a, b) => {
            return Number(a.plaatsId) - Number(b.plaatsId);
        });

        return {
            ...data,
            branches,
            geografie,
            locaties,
        };
    }

    // Merge de inhoud van de algemene `branches.json` met een markt specifieke
    // `branches.json`. Dit is een erfenis van de oude manier van het opslaan van
    // de markt configuratie. Hierin werden alle branches die er bestaan opgeslagen
    // in `config/markt/branches,json`, en de markt specifieke toevoegingen hierop
    // in `config/markt/NAAM/branches.json`. Deze methode merged beide bestanden, zodat
    // ze als één opgeslagen kunnen worden in de database. Op deze manier hoeven we niet
    // meerdere bestanden te versioneren.
    private static _mergeBranches(allBranches, marktBranches) {
        const mergedBranches = allBranches.map(branche => ({ ...branche }));

        if (!marktBranches) {
            return mergedBranches;
        }

        return marktBranches.reduce((result, marktBranche) => {
            const { brancheId } = marktBranche;
            const existing = result.find(b => b.brancheId === brancheId);

            if (existing) {
                Object.keys(marktBranche).forEach(key => {
                    existing[key] = marktBranche[key];
                });
            } else {
                result.push(marktBranche);
            }

            return result;
        }, mergedBranches);
    }
}

export const validateMarktConfig = configData => {
    const index = {
        ...INDEX,
        branches: indexBranches(configData.branches),
        locaties: indexMarktPlaatsen(configData.locaties),
        markt: indexMarktRows(configData.markt),
    };

    let errors = {};
    for (const property of CONFIG_PROPERTIES) {
        errors = VALIDATORS[property](errors, configData, property, index);
    }

    if (!Object.keys(errors).length) {
        return;
    }

    const validationError = Object.keys(errors).reduce((result, property) => {
        const propErrors = errors[property];
        const errorString = propErrors.reduce((errors, error) => `${errors}  ${error}\n`, '');
        return `${result}${property}\n${errorString}\n`;
    }, '');

    throw Error(validationError);
};

const VALIDATORS = {
    branches(errors, configData, property, index) {
        const validate = (fileErrors, marketBranches) => {
            marketBranches.reduce((unique, { brancheId }, i) => {
                if (unique.includes(brancheId)) {
                    fileErrors.push([`DATA[${i}] Duplicate branche '${brancheId}'`]);
                } else {
                    unique.push(brancheId);
                }

                return unique;
            }, []);
            return fileErrors;
        };

        return validateData(errors, configData, property, index, SCHEMAS.MarketBranches, validate, false);
    },

    geografie(errors, configData, property, index) {
        const validate = (fileErrors, { obstakels }) => {
            obstakels.reduce((unique, obstakel, i) => {
                const current = [obstakel.kraamA, obstakel.kraamB].sort();
                // Is obstakeldefinitie uniek?
                if (!unique.find(entry => entry.join() === current.join())) {
                    // Bestaan beide kramen in `locaties`?
                    if (obstakel.kraamA && !index.locaties.includes(obstakel.kraamA)) {
                        fileErrors.push(`DATA.obstakels[${i}].kraamA does not exist: ${obstakel.kraamA}`);
                    }
                    if (obstakel.kraamB && !index.locaties.includes(obstakel.kraamB)) {
                        fileErrors.push(`DATA.obstakels[${i}].kraamB does not exist: ${obstakel.kraamB}`);
                    }

                    // Staan beide kramen in verschillende rijen in `markt`?
                    if (
                        current[0] in index.markt &&
                        current[1] in index.markt &&
                        index.markt[current[0]] === index.markt[current[1]]
                    ) {
                        fileErrors.push(
                            `DATA.obstakels[${i}] kraamA and kraamB cannot be in the same row (kraamA: ${obstakel.kraamA}, kraamB: ${obstakel.kraamB})`,
                        );
                    }

                    unique.push(current);
                } else {
                    fileErrors.push(
                        `DATA.obstakels[${i}] is not unique (kraamA: ${obstakel.kraamA}, kraamB: ${obstakel.kraamB})`,
                    );
                }

                return unique;
            }, []);

            return fileErrors;
        };

        return validateData(errors, configData, property, index, SCHEMAS.MarketGeografie, validate, false);
    },

    locaties(errors, configData, property, index) {
        const validate = (fileErrors, locaties) => {
            locaties.reduce((unique, { plaatsId }, i) => {
                if (unique.includes(plaatsId)) {
                    fileErrors.push(`DATA[${i}].plaatsId is not unique: ${plaatsId}`);
                } else {
                    if (!(plaatsId in index.markt)) {
                        fileErrors.push(`DATA[${i}].plaatsId does not exist in markt: ${plaatsId}`);
                    }

                    unique.push(plaatsId);
                }

                return unique;
            }, []);

            return fileErrors;
        };

        return validateData(errors, configData, property, index, SCHEMAS.MarketLocaties, validate, true);
    },

    markt(errors, configData, property, index) {
        const validate = (fileErrors, { rows }) => {
            return rows.reduce((_fileErrors, row, i) => {
                row.forEach((plaatsId, j) => {
                    if (!index.locaties.includes(plaatsId)) {
                        _fileErrors.push(`DATA.rows[${i}][${j}].plaatsId does not exist in locaties: ${plaatsId}`);
                    }
                });

                return _fileErrors;
            }, fileErrors);
        };

        return validateData(errors, configData, property, index, SCHEMAS.Market, validate, true);
    },

    paginas(errors, configData, property, index) {
        const validate = (fileErrors, sections) => {
            sections.forEach((section, i) => {
                section.indelingslijstGroup.forEach((group, j) => {
                    if ('plaatsList' in group) {
                        fileErrors = group.plaatsList.reduce((_fileErrors, plaatsId, k) => {
                            return !index.locaties.includes(plaatsId)
                                ? _fileErrors.concat(
                                      `DATA[${i}].indelingslijstGroup[${j}].plaatsList[${k}] does not exist in locaties: ${plaatsId}`,
                                  )
                                : _fileErrors;
                        }, fileErrors);
                    }
                });
            });

            return fileErrors;
        };

        return validateData(errors, configData, property, index, SCHEMAS.Paginas, validate, true);
    },
};

function indexBranches(branches) {
    return branches.map(branche => branche.brancheId);
}
function indexMarktPlaatsen(plaatsen = []) {
    return plaatsen.map(plaats => plaats.plaatsId);
}
function indexMarktRows(markt) {
    if (!markt) {
        return {};
    }

    const index = {};
    markt.rows.forEach((row, rowNum) => {
        for (const plaatsId of row) {
            index[plaatsId] = rowNum;
        }
    });
    return index;
}

function validateData(errors, configData, property, index, schema, extraValidation, required = true) {
    let propErrors;

    if (required && !(property in configData)) {
        propErrors = ['Property is missing'];
    } else {
        propErrors = schema(index, configData[property]).errors.map(error => {
            switch (error.name) {
                case 'enum':
                    return `${error.property} has unknown value '${error.instance}'`;
                default:
                    return error.stack;
            }
        });
        if (!propErrors.length && typeof extraValidation === 'function') {
            propErrors = extraValidation(propErrors, configData[property]);
        }
    }

    return propErrors.length ? { ...errors, [property]: propErrors } : errors;
}
