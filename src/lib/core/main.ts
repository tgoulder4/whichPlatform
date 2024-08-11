'use server'
import { cache } from "react";
import cheerio from 'cheerio'
import { Service } from "@/lib/types";
import { findDestinationCodeByName } from "../destinations";

export const getServiceList = async (dest?: string): Promise<Service[]> => {
    console.log("getServiceList called with dest: ", dest)
    try {
        const url = `https://www.realtimetrains.co.uk/search/simple/gb-nr:EUS${dest ? `/to/gb-nr:${dest}` : ''}`;
        console.log("url used: ", url)
        const res = await fetch(url, {
            headers: {
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
            },
            // mode: 'no-cors',
        });
        console.log("res: ", res)
        const html = await res.text();
        const $ = cheerio.load(html);
        const list = $(".service").map((i, service) => {
            const status = $(service).find(".status").text();
            const platform = $(service).find(".platform").text();
            //departureTime is in format HHMM so we need to insert a colon in the middle
            const departureTime = $(service).find(".time").text().replace(/(\d{2})(\d{2})/, "$1:$2");
            const destinationStationName = $(service).find('.location')
                .clone() // Clone the element to ensure the original HTML is not modified
                .children('.addl').remove().end() // Remove the children with class 'addl'
                .text() // Extract the text content
                .trim(); // Trim any extra whitespace
            const stationCode = findDestinationCodeByName(destinationStationName);
            return { status, platform, departureTime, destinationStationName, stationCode };
        }).get();
        console.log("list returned: ", list)
        return list;

    } catch (e) {
        console.error(e);
        return [{ status: 'Error', platform: '0', departureTime: '--', destinationStationName: '--', stationCode: '--' }]
    }
}
