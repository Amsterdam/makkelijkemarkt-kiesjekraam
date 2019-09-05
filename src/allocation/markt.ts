import {
    IMarkt,
    IMarktplaats,
    IObstakelBetween,
    PlaatsId
} from '../markt.model';

import {
    flatten
} from '../util';

const Markt = {
    // Get adjacent places for one or multiple `plaatsIds`. The places passed in
    // `plaatsIds` are expected to be adjacent, or this function's behavior is
    // undefined.
    //
    // The resulting array of adjacent places are sorted in order of expansion:
    // first the places left of the original `plaatsIds`, then the places to the
    // right of it.
    getAdjacentPlaatsen: (
        markt: IMarkt,
        plaatsIds: PlaatsId[],
        depth: number = 1
    ): IMarktplaats[] => {
        const { rows, obstakels } = markt;
        const row = Markt._findRowForPlaatsen(rows, plaatsIds);

        return plaatsIds
        .map(plaatsId => {
            return [].concat(
                Markt._getAdjacent(row, plaatsId, -1, depth, obstakels),
                Markt._getAdjacent(row, plaatsId, 1, depth, obstakels)
            );
        })
        .reduce(flatten, [])
        // We need to filter out duplicates, and places that are included
        // in the `plaatsIds` argument. This occurs when multiple IDs are
        // requested — some overlap cannot be avoided.
        .reduce((result: IMarktplaats[], plaats) => {
            const plaatsId = plaats.plaatsId;
            if (
                !~plaatsIds.findIndex(id => id === plaatsId) &&
                !~result.findIndex(plaats => plaats.plaatsId === plaatsId)
            ) {
                result.push(plaats);
            }
            return result;
        }, []);
    },

    // Helper function for `getAdjacentPlaatsen`. All the `plaatsIds` should
    // reside in a single row, otherwise expansion to these places would be
    // impossible anyway — places in different rows are in a different physical
    // location.
    _findRowForPlaatsen: (
        rows: IMarktplaats[][],
        plaatsIds: PlaatsId[]
    ): IMarktplaats[] => {
        let found = 0;
        const result = rows.find(row => {
            const result = plaatsIds.filter(id => row.find(({ plaatsId }) => plaatsId === id));
            found = result.length;
            return !!result.length;
        });
        if (!result) {
            throw Error('Expected 1 result row');
        }
        if (found !== plaatsIds.length) {
            throw Error('Could not find all places in row');
        }

        return result;
    },

    // Search function for `getAdjacentPlaatsen`. Loops through array index numbers
    // starting from the index of `plaatsId`. When the row is circular the element
    // index number is wrapped around (see the assignment of `current` and `next` in
    // the loop).
    //
    // A circular row has the first element repeated at the end:
    //   `[1,2,3,1]` is a circular row where 3 and 1 are connected.
    _getAdjacent: (
        row: IMarktplaats[],
        plaatsId: PlaatsId,
        dir: number,
        depth: number = 1,
        obstacles: IObstakelBetween[] = []
    ) => {
        const isCircular = row[0].plaatsId === row[row.length-1].plaatsId;
        // The first and last element are equal, so remove the one at the end.
        row = isCircular ? row.slice(0, -1) : row;

        const places = [];
        const len    = row.length;
        const start  = row.findIndex(plaats => plaats.plaatsId === plaatsId);
        for (let i = 0; i < depth && i < len; i++) {
            const current = isCircular ?
                            row[(start + len+i*dir%len) % len] :
                            row[(start + i*dir)];
            const next    = isCircular ?
                            row[(start + len+(i+1)*dir%len) % len] :
                            row[(start + (i+1)*dir)];

            if (!next || Markt._hasObstacleBetween(obstacles, current.plaatsId, next.plaatsId)) {
                break;
            }

            places.push(next);
        }

        return places;
    },

    _hasObstacleBetween: (
        obstacles: IObstakelBetween[],
        plaatsAId: string,
        plaatsBId: string
    ): boolean => {
        return !!obstacles.find(obstacle => {
            return (obstacle.kraamA === plaatsAId && obstacle.kraamB === plaatsBId) ||
                   (obstacle.kraamA === plaatsBId && obstacle.kraamB === plaatsAId);
        });
    }
};

export default Markt;