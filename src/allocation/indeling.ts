import {
    IAfwijzingReason,
    IBranche,
    IMarktindeling,
    IMarktondernemer,
    IMarktplaats,
    IPlaatsvoorkeur,
    IRSVP
} from '../markt.model';

import {
    intersection,
    intersects
} from '../util';

import Markt from './markt';
import Ondernemer from './ondernemer';
import Toewijzing from './toewijzing';

const MARKET_FULL: IAfwijzingReason = {
    code: 1,
    message: 'Alle marktplaatsen zijn reeds ingedeeld'
};
const BRANCHE_FULL: IAfwijzingReason = {
    code: 2,
    message: 'Alle marktplaatsen voor deze branch zijn reeds ingedeeld'
};
const ADJACENT_UNAVAILABLE: IAfwijzingReason = {
    code: 3,
    message: 'Geen geschikte plaats(en) gevonden'
};
const MINIMUM_UNAVAILABLE: IAfwijzingReason = {
    code: 4,
    message: 'Minimum aantal plaatsen niet beschikbaar'
};

// `voorkeuren` should always be sorted by priority DESC, because we're using its array
// indices to sort by priority. See `Ondernemer.getPlaatsVoorkeuren()`.
const plaatsVoorkeurCompare = (plaatsA: IMarktplaats, plaatsB: IMarktplaats, voorkeuren: IPlaatsvoorkeur[]): number => {
    const max = voorkeuren.length;
    const a   = voorkeuren.findIndex(({ plaatsId }) => plaatsId === plaatsA.plaatsId);
    const b   = voorkeuren.findIndex(({ plaatsId }) => plaatsId === plaatsB.plaatsId);
    // ~-1 == 0, so we can kick a or b to EOL if it's not found.
    return (~a ? a : max) - (~b ? b : max);
};
// Sort DESC on branche overlap with provided `branches` array. The more overlap, the better.
const brancheCompare = (a: IMarktplaats, b: IMarktplaats, branches: IBranche[]): number => {
    return intersection(b.branches, branches).length -
           intersection(a.branches, branches).length;
};

const Indeling = {
    assignPlaats: (
        indeling: IMarktindeling,
        ondernemer: IMarktondernemer,
        plaatsen: IMarktplaats[],
        handleRejection: 'reject' | 'ignore' = 'reject',
        maximum: number = 1
    ): IMarktindeling => {
        try {
            if (indeling.openPlaatsen.length === 0) {
                throw MARKET_FULL;
            } else if (Ondernemer.isInMaxedOutBranche(indeling, ondernemer)) {
                throw BRANCHE_FULL;
            }

            const mogelijkePlaatsen = plaatsen || indeling.openPlaatsen;
            const bestePlaatsen = Indeling.findBestePlaatsen(indeling, ondernemer, mogelijkePlaatsen, maximum);
            if (!bestePlaatsen.length) {
                throw ADJACENT_UNAVAILABLE;
            }

            return bestePlaatsen.reduce((indeling, plaats) => {
                return Indeling._assignPlaats(indeling, ondernemer, plaats);
            }, indeling);
        } catch (errorMessage) {
            return handleRejection === 'reject' ?
                   Indeling._rejectOndernemer(indeling, ondernemer, errorMessage) :
                   indeling;
        }
    },

    assignVastePlaatsen: (
        indeling: IMarktindeling,
        ondernemer: IMarktondernemer
    ): IMarktindeling => {
        const available = Indeling.findBestePlaatsenForVPH(indeling, ondernemer);

        if (available.length === 0) {
            const startSize = Ondernemer.getStartSize(ondernemer);
            return Indeling.assignPlaats(indeling, ondernemer, null, 'reject', startSize);
        } else {
            return available.reduce((indeling, plaats) => {
                return Indeling._assignPlaats(indeling, ondernemer, plaats);
            }, indeling);
        }
    },

    findBestePlaatsen: (
        indeling: IMarktindeling,
        ondernemer: IMarktondernemer,
        openPlaatsen: IMarktplaats[],
        maximum: number = 1
    ) => {
        const expansionSize        = maximum - 1;
        const voorkeuren           = Ondernemer.getPlaatsVoorkeuren(indeling, ondernemer);
        const ondernemerBranches   = Ondernemer.getBranches(indeling, ondernemer);

        const { anywhere = true }  = ondernemer.voorkeur || {};
        const voorkeurIds          = voorkeuren.map(({ plaatsId }) => plaatsId);
        const verplichteBrancheIds = ondernemerBranches
                                    .filter(({ verplicht = false }) => verplicht)
                                    .map(({ brancheId }) => brancheId);

        const mogelijkePlaatsen = openPlaatsen.filter(({ plaatsId, branches = [] }) => {
            if (
                // Ondernemer is in verplichte branche, maar plaats voldoet daar niet aan.
                verplichteBrancheIds.length && !intersects(verplichteBrancheIds, branches) ||
                // Ondernemer wil niet willekeurig ingedeeld worden en plaats staat niet in voorkeuren.
                !anywhere && !voorkeurIds.includes(plaatsId) ||
                // Niet genoeg vrije aansluitende plaatsen om maximum te verzadigen.
                Markt.getAdjacentPlaatsen(indeling, [plaatsId], expansionSize).length < expansionSize
            ) {
                return false;
            } else {
                return true;
            }
        });

        // Sorteer plaatsen op voorkeursprioriteit, daarna op overlap in ondernemersbranches.
        return mogelijkePlaatsen
        .sort((a, b) => {
            return plaatsVoorkeurCompare(a, b, voorkeuren) ||
                   brancheCompare(a, b, ondernemerBranches);
        })
        .slice(0, maximum);
    },

    findBestePlaatsenForVPH: (
        indeling: IMarktindeling,
        ondernemer: IMarktondernemer
    ): IMarktplaats[] => {
        const startSize  = Ondernemer.getStartSize(ondernemer);
        const voorkeuren = Ondernemer.getPlaatsVoorkeuren(indeling, ondernemer);
        const available  = voorkeuren.filter(plaats =>
            Indeling._isAvailable(indeling, plaats)
        );
        const grouped    = Markt.groupByAdjacent(indeling, available);

        if (!Ondernemer.wantsToMove(indeling, ondernemer)) {
            return grouped.reduce((result, group) => {
                return group.length > result.length ? group : result;
            }, [])
            .slice(0, startSize);
        }

        let result;
        const { anywhere = true } = ondernemer.voorkeur || {};
        grouped.some(group => {
            if (group.length < startSize && anywhere) {
                const depth     = startSize - group.length;
                const plaatsIds = group.map(({ plaatsId }) => plaatsId);
                const adjacent  = <IPlaatsvoorkeur[]> Markt.getAdjacentPlaatsen(indeling, plaatsIds, depth, (plaats) =>
                    Indeling._isAvailable(indeling, plaats)
                );
                group = group.concat(adjacent);
                group = Markt.groupByAdjacent(indeling, group)[0];
            }


            if (group.length >= startSize) {
                result = group.slice(0, startSize);
                return true;
            } else {
                return false;
            }
        });

        return result || [];
    },

    isAanwezig: (aanwezigheid: IRSVP[], ondernemer: IMarktondernemer) => {
        const rsvp = aanwezigheid.find(aanmelding => aanmelding.erkenningsNummer === ondernemer.erkenningsNummer);

        // Vasteplaatshouders die niets hebben laten weten en die hebben bevestigd dat ze
        // komen worden meegeteld als aanwezig. Alleen de expliciete afmeldingen worden
        // niet in overweging genomen in de indeling van kramen.
        if (ondernemer.status === 'vpl') {
            return !rsvp || !!rsvp.attending || rsvp.attending === null;
        } else {
            return !!rsvp && !!rsvp.attending;
        }
    },

    performExpansion: (indeling: IMarktindeling): IMarktindeling => {
        let queue = indeling.toewijzingen.filter(toewijzing =>
            Ondernemer.wantsExpansion(toewijzing)
        );

        while (
            indeling.openPlaatsen.length && queue.length &&
            indeling.expansionIteration <= indeling.expansionLimit
        ) {
            queue = queue.reduce((newQueue, toewijzing) => {
                const { ondernemer } = toewijzing;

                if (Ondernemer.canExpandInIteration(indeling, toewijzing)) {
                    const adjacent            = Markt.getAdjacentPlaatsen(indeling, toewijzing.plaatsen, 1);
                    const openAdjacent        = intersection(adjacent, indeling.openPlaatsen);
                    const [uitbreidingPlaats] = Indeling.findBestePlaatsen(indeling, ondernemer, openAdjacent);

                    if (uitbreidingPlaats) {
                        indeling   = Indeling._assignPlaats(indeling, ondernemer, uitbreidingPlaats);
                        toewijzing = Toewijzing.find(indeling, ondernemer);
                    }
                }

                if (Ondernemer.wantsExpansion(toewijzing)) {
                    newQueue.push(toewijzing);
                }

                return newQueue;
            }, []);

            indeling.expansionIteration++;
        }

        // The people still in the queue have fewer places than desired. Check if they
        // must be rejected because of their `minimum` setting.
        return queue.reduce((indeling, { ondernemer, plaatsen }) => {
            const { minimum = 0 } = ondernemer.voorkeur || {};
            return minimum > plaatsen.length ?
                   Indeling._rejectOndernemer(indeling, ondernemer, MINIMUM_UNAVAILABLE) :
                   indeling;
        }, indeling);
    },

    _assignPlaats: (
        indeling: IMarktindeling,
        ondernemer: IMarktondernemer,
        plaats: IMarktplaats
    ): IMarktindeling => {
        const existingToewijzing = Toewijzing.find(indeling, ondernemer);
        let newToewijzing = Toewijzing.create(indeling, plaats, ondernemer);

        if (existingToewijzing) {
            newToewijzing = Toewijzing.merge(existingToewijzing, newToewijzing);
        }

        indeling = Toewijzing.replace(indeling, existingToewijzing, newToewijzing);

        return {
            ...indeling,
            toewijzingQueue: indeling.toewijzingQueue.filter(({ erkenningsNummer }) =>
                erkenningsNummer !== ondernemer.erkenningsNummer
            )
        };
    },

    _isAvailable: (
        indeling: IMarktindeling,
        plaats: IMarktplaats
    ): boolean => {
        return !!~indeling.openPlaatsen.findIndex(({ plaatsId }) =>
            plaatsId === plaats.plaatsId
        );
    },

    _rejectOndernemer: (
        indeling: IMarktindeling,
        ondernemer: IMarktondernemer,
        reason: IAfwijzingReason
    ): IMarktindeling => {
        const { erkenningsNummer } = ondernemer;
        const afwijzingen = indeling.afwijzingen.concat({
            marktId          : indeling.marktId,
            marktDate        : indeling.marktDate,
            erkenningsNummer : ondernemer.erkenningsNummer,
            reason,
            ondernemer
        });

        const toewijzing = Toewijzing.find(indeling, ondernemer);
        if (toewijzing) {
            indeling = Toewijzing.remove(indeling, toewijzing);
        }

        return {
            ...indeling,
            afwijzingen,
            toewijzingQueue: indeling.toewijzingQueue.filter(ondernemer =>
                ondernemer.erkenningsNummer !== erkenningsNummer
            )
        };
    }
};

export default Indeling;
