'use client'
import React, { useState } from 'react'
import WebSocket from 'ws';
import { env } from '@/env';
import { TrackState } from '@/lib/types';
import { maxWidthClassNames } from '@/lib/layout';
import { redirect } from 'next/navigation';
import { findStationNameByCode } from '@/lib/destinations';
import { dissectTrainInfoFromUrl } from './get-station-details-from-station-code';
import HeaderLogoWithName from './LogoWithName';
import TrackingArea from './TrackingArea';

type Props = {
    searchParams: { [key: string]: string | string[] | undefined }
}


function TrackPage({ searchParams }: Props) {
    const journeysInCondensedURLformat = searchParams.trains as string;
    // console.log("trains found in url: ", journeysInCondensedURLformat)
    if (!journeysInCondensedURLformat) {
        console.error("No trains to track")
        redirect('/404');
    }
    const [selectedServiceToTrack, setSelectedServiceToTrack] = useState(0);
    //url like http://localhost:3000/track?trains=T-1940D-BHMA-MAN
    const servicesToTrack = dissectTrainInfoFromUrl(journeysInCondensedURLformat);
    // console.log("servicesToTrack: ", servicesToTrack)
    return (
        <main className="flex h-fit flex-col pb-48">
            <div className={`navArea sticky top-0 w-full pt-8 lg:pt-8 pb-0 z-50 md:pt-16 bg-zinc-900 text-white`}>
                <div className={`${maxWidthClassNames} flex flex-col justify-between gap-8 items-center`}>
                    <HeaderLogoWithName pageTitle='Track platform' />
                    <div className="flex flex-row justify-start w-full gap-2">
                        {servicesToTrack.length > 1 && servicesToTrack.map((service, index) =>
                            //switcher
                            <div onClick={() => { setSelectedServiceToTrack(index) }} key={service.departure.code + service.departure.time} className="flex cursor-pointer hover:bg-white/5 flex-col gap-3">
                                {service.aimStation && <h3>{service.aimStation.name ? "Via " + service.aimStation.name : service.departure.name} </h3>}
                                <div className="h-3 w-full bg-white/20"></div>
                            </div>)
                        }

                    </div>
                </div>
            </div>
            <TrackingArea serviceToTrack={servicesToTrack[0]} />
        </main>
    )
}

export default TrackPage