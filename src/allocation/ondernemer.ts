import {
    IBranche,
    IMarkt,
    IMarktindeling,
    IMarktondernemer,
    IMarktplaats,
    IPlaatsvoorkeur
} from '../markt.model';

import {
    count,
    numberSort,
    sum
} from '../util';


const priorityCompare = (voorkeurA?: IPlaatsvoorkeur, voorkeurB?: IPlaatsvoorkeur): number => {
    const prioA = voorkeurA && typeof voorkeurA.priority === 'number' ? voorkeurA.priority : 0;
    const prioB = voorkeurB && typeof voorkeurB.priority === 'number' ? voorkeurB.priority : 0;

    return numberSort(prioB, prioA);
};

const Ondernemer = {
    getBrancheIds: (markt: IMarkt, ondernemer: IMarktondernemer) => {
      return ondernemer.voorkeur && ondernemer.voorkeur.branches ||
             [];
    },

    getBranches: (markt: IMarkt, ondernemer: IMarktondernemer): IBranche[] => {
        const brancheIds = Ondernemer.getBrancheIds(markt, ondernemer);

        return brancheIds.reduce((branches, brancheId) => {
            const branche = markt.branches.find(b => b.brancheId === brancheId);
            if (branche) {
                branches.push(branche);
            }
            return branches;
        }, []);
    },

    getTargetSize: (ondernemer: IMarktondernemer): number => {
        const voorkeur = ondernemer.voorkeur;
        return voorkeur ?
               Math.max(1, voorkeur.minimum || null, voorkeur.maximum || null) :
               1;
    },

    getDefaultVoorkeurPlaatsen: (markt: IMarkt, ondernemer: IMarktondernemer): IPlaatsvoorkeur[] => {
        const { plaatsen = [], erkenningsNummer } = ondernemer;
        return plaatsen.map(plaatsId => ({
            erkenningsNummer,
            marktId: markt.marktId,
            plaatsId,
            priority: 0
        }));
    },

    getVoorkeurPlaatsen: (markt: IMarkt, ondernemer: IMarktondernemer): IPlaatsvoorkeur[] => {
        const voorkeuren = markt.voorkeuren.filter(voorkeur => voorkeur.erkenningsNummer === ondernemer.erkenningsNummer);
        return voorkeuren.sort(priorityCompare);
    },

    heeftVastePlaats: (ondernemer: IMarktondernemer, plaats: IMarktplaats): boolean => {
        if (!ondernemer.plaatsen) {
            return false;
        }
        return !!ondernemer.plaatsen.find(plaatsId => plaatsId === plaats.plaatsId);
    },

    heeftVastePlaatsen: (ondernemer: IMarktondernemer): boolean => {
        return Ondernemer.isVast(ondernemer) && count(ondernemer.plaatsen) > 0;
    },

    isInBranche: (markt: IMarkt, ondernemer: IMarktondernemer, branche: IBranche): boolean => {
        const brancheIds = Ondernemer.getBrancheIds(markt, ondernemer);
        return brancheIds.includes(branche.brancheId);
    },

    isInMaxedOutBranche: (indeling: IMarktindeling, ondernemer: IMarktondernemer): boolean => {
        const branches = Ondernemer.getBranches(indeling, ondernemer);

        // For each branche this ondernemer is in, find out if it has already
        // exceeded the maximum amount of toewijzingen or the maximum amount
        // of plaatsen.
        return !!branches.find(branche => {
            const { maximumToewijzingen, maximumPlaatsen } = branche;
            const brancheToewijzingen = indeling.toewijzingen.filter(toewijzing =>
                Ondernemer.isInBranche(indeling, toewijzing.ondernemer, branche)
            );
            const branchePlaatsen = brancheToewijzingen
                                    .map(toewijzing => toewijzing.plaatsen.length)
                                    .reduce(sum, 0);

            return maximumToewijzingen && brancheToewijzingen.length >= maximumToewijzingen ||
                   maximumPlaatsen     && branchePlaatsen >= maximumPlaatsen;
        });
    },

    isVast: (ondernemer: IMarktondernemer): boolean => {
        return ondernemer.status === 'vpl' || ondernemer.status === 'vkk';
    }
};

export default Ondernemer;
