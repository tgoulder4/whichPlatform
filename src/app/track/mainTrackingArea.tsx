'use client'
import React, { useEffect, useState } from 'react'
import WebSocket from 'ws';
import { env } from '@/env';
import { Journey, Service, TrackState } from '@/lib/types';
import { maxWidthClassNames } from '@/lib/layout';
import DepartureCard from '../Cards';
import { getColourFromStatus, getDescriptionFromStatus, getGlyphFromStatus, getIntuitiveStatusFromStatus } from './getRenderInfoFromState';
import CheckingAgainTimer from './checkingAgainTimer';
import { TrackStateSchema } from '@/lib/schemas';
import { getTimeDestAimInfoFromUrl, TGetTimeDestAimInfoFromUrl, TParsedTrainInfo } from './parseServiceInfoFromUrl';
import { hc } from 'hono/client'
import { dissectOneTrainInfoFromUrl } from './dissectServicesToTrack';
import { useServerAction } from "zsa-react";
import { getTrackStateSA } from './actions';
type Props = {
    condensedURLserviceToTrack: string;
}

function MainTrackingArea({ condensedURLserviceToTrack }: Props) {
    const [currentTrackingState, setCurrentTrackingState] = useState<TrackState>({
        data: {
            status: "Prepare",
            platform: {
                number: "--",
                type: "confirmedAndChanged"
            },
            destination: { name: "--", code: "--" },
            provider: "--",
            scheduledDepartureTime: "--",
        },
        hidden: {
            timeTillRefresh: 30000,
        }
    });
    const { execute, isPending } = useServerAction(getTrackStateSA);

    async function getTrackingState(serviceToTrack: Journey) {
        try {
            console.log("executing getTrackStateSA with: ", serviceToTrack);
            const res = (await execute({ journey: serviceToTrack }));
            console.log("res: ", res);
            const data = res[0];
            console.log("data: ", data);

            const parseResult = TrackStateSchema.safeParse(data);
            if (parseResult.success) {
                const TrackState = parseResult.data;
                return TrackState;
            } else {
                const error = parseResult.error.errors[0];
                console.error(error)
                throw new Error(error.message);
            }
        } catch (e) {
            console.log(e)
            return {
                data: {
                    status: "Error",
                    platform: {
                        number: "0",
                        type: "confirmedAndChanged"
                    },
                    destination: { name: "--", code: "--" },
                    provider: "--",
                    scheduledDepartureTime: "--",
                },
                hidden: {
                    timeTillRefresh: 1000000000,
                    error: e
                }
            } as TrackState
        }
    }
    useEffect(() => {
        const serviceToTrack = dissectOneTrainInfoFromUrl(condensedURLserviceToTrack);
        // console.log("serviceToTrack: ", serviceToTrack);
        async function main() {
            const newState = await getTrackingState(serviceToTrack);
            setCurrentTrackingState(newState);
        }
        const timer = setInterval(async () => {
            main();
        }, currentTrackingState.hidden.timeTillRefresh)
        main();

        return () => {
            clearInterval(timer);
        }
    }, [])
    //url like http://localhost:3000/track?trains=1940BHM+1200MAN
    const {
        destination,
        scheduledDepartureTime,
        provider,
        status,
        platform
    } = currentTrackingState.data;
    return (
        <div className={`flex h-full w-full flex-col py-8 bg-slate-100 ${maxWidthClassNames}`}>
            <div className="flex flex-col items-center gap-3 transition-all">
                <DepartureCard shouldntDisplace className='w-full' partialDepartureInfo={{
                    destination: { name: destination.name, code: destination.code },
                    scheduledDepartureTime,
                    provider
                }} />
                <div className="hidden bg-yellow-800 bg-red-800 bg-green-800 bg-slate-800"></div>
                <div className={`p-5 w-full statusCard text-white flex flex-col items-center animate transition-colors ${getColourFromStatus(status)}`}>
                    <div className="flex flex-col items-center mt-3">
                        <h2 className='font-semibold -mb-10'>Platform</h2>
                        <h1 className='text-[11.25rem]'>{platform.number}</h1>
                    </div>
                    <div className="py-3 grid place-items-center bg-white/10 w-full">{getIntuitiveStatusFromStatus(status)}</div>
                </div>
                <div className="w-full flex flex-col  md:flex-row gap-3">
                    <div className="bg-black/5 w-full grid place-items-center py-5">
                        <div className="w-1/2 max-w-xl items-center flex flex-col gap-2">
                            {getGlyphFromStatus(status)}
                            <h3 className='w-full text-center'>{getDescriptionFromStatus(status)}</h3>
                        </div>
                    </div>
                    <CheckingAgainTimer startTime={currentTrackingState.hidden.timeTillRefresh} />
                </div>
                {process.env.NODE_ENV == "development" && currentTrackingState.hidden.error && <div className="bg-white text-red-800 p-5">{String(currentTrackingState.hidden.error)}</div>}
            </div>
        </div>
    )
}

export default MainTrackingArea