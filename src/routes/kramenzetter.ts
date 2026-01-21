import { GrantedRequest } from 'keycloak-connect';
import { NextFunction, Response } from 'express';

import { MMMarkt } from '../model/makkelijkemarkt.model'
import { getAllowedMarketsFromToken } from "../roles";
// import { getMarkten, getMarkt } from '../makkelijkemarkt-api'
import { getMarkten, getMarkt, getIndelingData } from '../daalder-api'
import { Roles } from '../authentication'
import { getKeycloakUser } from '../keycloak-api';
import { internalServerErrorPage, HTTP_FORBIDDEN_ERROR, HTTP_PAGE_NOT_FOUND } from '../express-util';
import { getMarktDays, parseMarktDag, isAfterMailingTime } from '../domain-knowledge'
import { safeCastStringValueToInt, today, tomorrow, validateDateStringHasISOFormat } from '../util'
// import { getIndelingslijst } from '../pakjekraam-api';

const _getAllowedMarkets = (req: GrantedRequest) => {
    const allowedMarkets = getAllowedMarketsFromToken(req)
    return getMarkten(false).then((markten: MMMarkt[]) => {
        return markten.filter((markt: MMMarkt) => allowedMarkets?.includes(markt.afkorting))
    })
}

const _getIndelingForTodayOrTomorrow = (markt: MMMarkt) => {

    // If it's after allocation time we assume the kramenzetter wants to see the
    // indeling of tomorrow, not today.
    const nextAllocationDate = isAfterMailingTime() ? tomorrow() : today()
    const marktDagen = (markt.marktDagen || []).map(parseMarktDag);
    const dates = getMarktDays(nextAllocationDate, nextAllocationDate, marktDagen)

    // We always want to show 1 link to not confuse kramenzetters.
    // If there are no available dates, we dont show a link.
    return dates.length ? dates[0] : ''
}

const _setIndelingForTodayOrTomorrow = (markt) => {
    return {nextIndelingsDate: _getIndelingForTodayOrTomorrow(markt), ...markt}
}

const _isAllowedToSeeIndeling = (req: GrantedRequest, markt: MMMarkt, marktDate: string) => {
    const allowedMarkets = getAllowedMarketsFromToken(req)

    if (!allowedMarkets.includes(markt.afkorting)) {
        return false
    }
    if (_getIndelingForTodayOrTomorrow(markt) !== marktDate) {
        return false
    }
    return true
}

export const getKramenzetterOverzichtPage = (req: GrantedRequest, res: Response, next: NextFunction) => {
    _getAllowedMarkets(req).then((markten: any) => {
        const marktenWithIndelingsDate = markten.map((markt) => _setIndelingForTodayOrTomorrow(markt))
        res.render('KramenzetterOverzichtPage', {
            markten: marktenWithIndelingsDate,
            role: Roles.KRAMENZETTER,
            user: getKeycloakUser(req)
        });
    }, internalServerErrorPage(res))
}

export const getKramenzetterIndelingsPage = async (req: GrantedRequest, res: Response, next: NextFunction) => {
    const marktId = req.params.marktId
    const marktDate = req.params.datum
    const indelingstype = 'indeling'
    const user = getKeycloakUser(req)

    try {
        // validate inputs
        safeCastStringValueToInt(marktId);
        validateDateStringHasISOFormat(marktDate);

        const markt = await getMarkt(marktId)
        if (!_isAllowedToSeeIndeling(req, markt, marktDate)) {
            console.log(`[Not Allowed] Kramenzetter ${user.sub} tried to access markt id ${marktId} on ${marktDate}`)
            return res.status(HTTP_FORBIDDEN_ERROR).send('Het is niet toegestaan om als kramenzetter deze indeling te zien')
        }

        const indeling = await getIndelingData(marktId, marktDate)
        if (!indeling) {
            return res.status(HTTP_PAGE_NOT_FOUND).send(`Indeling voor ${marktDate} niet gevonden!`)
        }
        return res.render('IndelingslijstPage.tsx', {
            ...indeling,
            indelingstype,
            datum: marktDate,
            role: Roles.KRAMENZETTER,
            user: user
        });
    } catch (err) {
        console.log(`Cant get indeling for ${Roles.KRAMENZETTER} for marktId ${marktId} on ${marktDate}`)
        internalServerErrorPage(res)(err)
    }
}
