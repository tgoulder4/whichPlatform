
import { Journey, Service, TrackState } from "@/lib/types";
import { getServiceListCA } from "./main";
import { getMillisecondsTilRefresh } from "@/utils/timeUtils";
export async function getTrackStateCA(journey: Journey): Promise<TrackState> {
    const {
        departure,
    } = journey
    console.log("getTrackStateCA called with journey: ", journey);
    const serviceList = await getServiceListCA(departure.code);
    const correspondingJourney = serviceList.find(service => (service.destination.code == departure.code && service.scheduledDepartureTime == departure.time));
    console.log("correspondingJourney: ", correspondingJourney);
    if (!correspondingJourney || !correspondingJourney.scheduledDepartureTime) throw new Error("We couldn't find the journey.");

    const timeTilRefresh = getMillisecondsTilRefresh(correspondingJourney!.status, correspondingJourney!.scheduledDepartureTime);
    console.log("timeTilRefresh: ", timeTilRefresh);
    const updateKey = Math.random().toString(36).substring(7);
    console.log("getMillisecondsTilRefresh returning: ", timeTilRefresh);
    const ts: TrackState = {
        data: correspondingJourney as Service,
        hidden: {
            timeTilRefresh,
            updateKey
        }
    }
    return ts;
}