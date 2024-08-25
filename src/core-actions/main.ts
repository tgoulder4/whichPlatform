'use server'
import { cache } from "react";
import cheerio from 'cheerio'
import { Service } from "@/lib/types";
import { findStationCodeByName } from "../lib/destinations";
import { env } from "@/env";
import { convertDateToUTC, getTimeInMsUntilStartPolling } from "@/utils/timeUtils";
function checkIfClassInPlatformSpan($: cheerio.Root, service: cheerio.Element, str: string) {
    return $(service).find(".platform span").attr("class")?.includes(str)
}

/**
 * 
 * @param dest The destination code of the station. If not provided, the function will return the services to all destinations.
 * @returns A list of service objects of type Service.
 */
export const getServiceListCA = async (dest?: string): Promise<Service[]> => {
    console.log("getServiceListCA called with dest: ", dest)
    try {
        let res: Response;
        let url: any;
        if (env.NODE_ENV === "production") { //DO NOT CHANGE THIS LINE
            url = 'https://proxy.scrapeops.io/v1/?' + new URLSearchParams({
                api_key: env.SCRAPEOPS_API_KEY,
                url: `https://www.realtimetrains.co.uk/search/simple/gb-nr:EUS${dest ? `/to/gb-nr:${dest}` : ''}`
            })
        } else {
            url =
                `https://www.realtimetrains.co.uk/search/simple/gb-nr:EUS${dest ? `/to/gb-nr:${dest}` : ''}`
            // for testing: 
            // 'http://localhost:3000/tests/departuresNoAim'
        }
        console.log("fetching from url: ", url)
        res = await fetch(url)

        if (!res.ok) throw new Error("Failed to fetch data. Code RES_NOT_OK")
        // console.log("res: ", res)
        const html = await res.text();
        // console.log("html: ", html)
        const $ = cheerio.load(html);
        const list = $(".service").map((i, service) => {
            const platform = {
                number: $(service).find(".platform").text(),
            }
            const destinationStationName = $(service).find('.location')
                .clone() // Clone the element to ensure the original HTML is not modified
                .children('.addl').remove().end() // Remove the children with class 'addl'
                .text() // Extract the text content
                .trim(); // Trim any extra whitespace
            const destination = {
                name: destinationStationName,
                code: findStationCodeByName(destinationStationName)
            }
            const scheduledDepartureTime = $(service).find(".time").text();
            const provider = $(service).find(".secline").text().split("·")[0].trim().replace(" service", "");
            let status: Service["status"];
            if (checkIfClassInPlatformSpan($, service, "a") && !checkIfClassInPlatformSpan($, service, "c")) {
                status = "Go"
            }
            else if (checkIfClassInPlatformSpan($, service, "c") && checkIfClassInPlatformSpan($, service, "a")) {
                status = "Go"
            } else if (checkIfClassInPlatformSpan($, service, "ex")) {
                const depHours = Number(scheduledDepartureTime.slice(0, 2));
                const depMins = Number(scheduledDepartureTime.slice(2));
                //make a new date from dephours and depmins
                const dd = new Date();
                dd.setHours(depHours);
                dd.setMinutes(depMins);
                const depDateUTC = convertDateToUTC(dd);

                const getTimeUntilStartPolling = getTimeInMsUntilStartPolling(depDateUTC.getHours(), depDateUTC.getMinutes());
                console.log("getTimeUntilStartPolling: ", getTimeUntilStartPolling)
                if (getTimeUntilStartPolling > 0) {
                    status = "Prepare"
                } else {
                    status = 'Wait'
                }
            } else {
                status = 'Error'
            }

            return { status, platform, scheduledDepartureTime, destination, provider } as Service;
        }).get();
        // console.log("list returned: ", list)
        return list;

    } catch (e) {
        console.error(e);
        return [{
            status: 'Error', platform: {
                number: '--',
            }, provider: "Avanti", scheduledDepartureTime: '--', destination: { name: '', code: '' }
        }]
    }
}
