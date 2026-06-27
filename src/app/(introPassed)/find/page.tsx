'use client'
import { stationNamesWithCodes } from "@/lib/map";
import cheerio from 'cheerio'
import { useServerAction } from 'zsa-react'
import { addIfNewOrRemoveIfExistingItemFromArray, cn } from "@/lib/utils";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form'
import { ComboBox } from "@/components/ui/combobox";
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from "react-hook-form";
import { z } from "zod";
import { getServiceListCA } from "../../../core-actions/main";
import { Service } from "@/lib/types";
import { maxWidthClassNames } from "@/lib/layout";
import { applicationName } from "@/app-config";
import { Input } from "@/components/ui/input";
import DepartureCard, { CardPrim } from "../../DepartureCard";
import { Button } from "@/components/ui/button";
import { checkTrueStationName, findStationCodeByName, findStationNameByCode } from "@/lib/destinations";
import { findUniquelyNamedDepartures } from "@/lib/departures";
import DeparturesComboBoxFormField from "./departuresComboBoxFormField";
import HeaderLogoWithName from "../../track/LogoWithName";
import { toast } from "sonner";


export default function Home({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
    //header form stuff
    const formSchema = z.object({ dest: z.string().length(3).or(z.string().length(0)), dep: z.literal("London Euston") });
    const [departures, setDepartures] = useState<Service[]>([
        // {
        //     destination: { name: "Birmingham New Street", code: "BHM" },
        //     scheduledDepartureTime: "12:00",
        //     platform: {
        //         number: "1",
        //     },
        //     status: "Wait",
        //     provider: "Avanti West Coast"
        // },
        // {
        //     destination: { name: "Birmingham New Street", code: "BHM" },
        //     scheduledDepartureTime: "13:00",
        //     platform: {
        //         number: "1",
        //     },
        //     status: "Wait",
        //     provider: "Avanti West Coast"
        // }
    ]);
    const [renderedDepartures, setRenderedDepartures] = useState<Service[]>([
        {
            destination: { name: "LOAD", code: "LOAD" },
            scheduledDepartureTime: "LOAD",
            platform: {
                number: "LOAD",
            },
            status: "Go",
            provider: "Avanti West Coast"
        },
        {
            destination: { name: "LOAD", code: "LOAD" },
            scheduledDepartureTime: "LOAD",
            platform: {
                number: "LOAD",
            },
            status: "Go",
            provider: "Avanti West Coast"
        },
        {
            destination: { name: "LOAD", code: "LOAD" },
            scheduledDepartureTime: "LOAD",
            platform: {
                number: "LOAD",
            },
            status: "Go",
            provider: "Avanti West Coast"
        },
    ]);
    const [aimStation, setAimStation] = useState<{ name: string, code: string }>({ name: "", code: "" });
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            dest: '',
            dep: 'London Euston'
        }
    })
    async function onSubmit(data: z.infer<typeof formSchema>) {
        console.log("onSubmit called with data: ", data)
        setSelectedDepartures([])
        setRenderedDepartures([
            {
                destination: { name: "LOAD", code: "LOAD" },
                scheduledDepartureTime: "LOAD",
                platform: {
                    number: "LOAD",

                },
                status: "Go",
                provider: "Avanti West Coast"
            },
            {
                destination: { name: "LOAD", code: "LOAD" },
                scheduledDepartureTime: "LOAD",
                platform: {
                    number: "LOAD",

                },
                status: "Go",
                provider: "Avanti West Coast"
            },
            {
                destination: { name: "LOAD", code: "LOAD" },
                scheduledDepartureTime: "LOAD",
                platform: {
                    number: "LOAD",

                },
                status: "Go",
                provider: "Avanti West Coast"
            },
        ])
        const aimStationCode = data.dest;
        if (aimStationCode) {
            console.log("onsubmit calling getServiceListCA with aimStationCode: ", aimStationCode)
            const services = await getServiceListCA(aimStationCode);
            setRenderedDepartures(services.slice(0, 8));
        } else {
            setRenderedDepartures(departures);
        }
        setAimStation({ name: findStationNameByCode(aimStationCode), code: aimStationCode });
    }
    //select the string station codes for easy appending to the URL
    const [selectedDepartures, setSelectedDepartures] = useState<string[]>([]);
    const [noSelectionError, setNoSelectionError] = useState<string | null>(null);
    useEffect(() => {
        console.log("searchParams: ", searchParams)
        if (searchParams.err) {
            toast.error(searchParams.err as string);
        }
    }, []);
    useEffect(() => {
        async function fetchData() {
            const allServices = await getServiceListCA();
            console.log("Refreshign data, allServices: ", allServices)
            console.log("allServices: ", allServices)
            setDepartures(allServices);
            setRenderedDepartures(allServices);
            //if selected departures contain departure time with dest code any that are not in the new list, remove them and toast. should toast is boolean
            const shouldToast = selectedDepartures.some(
                dep => !allServices.some(service => service.destination.code == dep.slice(dep.indexOf("D-") + 2, dep.indexOf("A-")))
            )
            if (shouldToast) toast.error("One or more of your selected departures are no longer available.")
        }


        fetchData()
        const timer = setInterval(() => {
            fetchData()
        }, 60000);
        return () => clearInterval(timer);
    }, []);
    return (
        <main className="flex min-h-fit flex-col pb-48"  >
            <div className={`hidden ${maxWidthClassNames}`}></div>
            <div className={`navArea top-0 left-0 z-10 w-full pt-8 md:pt-16 pb-4  bg-zinc-900 bg-opacity-40`}>
                <div className={`${maxWidthClassNames} flex flex-col gap-8 items-center px-8 pt-8 md:px-16 md:mx-auto md:pt-0`}>
                    <HeaderLogoWithName pageTitle={`${applicationName}`} />
                    <Form {...form}>
                        <form className="w-full" onSubmit={form.handleSubmit(onSubmit)}>
                            <div className="w-full flex flex-col gap-4">
                                <div className="flex flex-row gap-2">
                                    <div className={` hidden w-full  flex-row items-center gap-2`}>
                                        <p className="opacity-40  text-white">From:</p>
                                        <FormField
                                            control={form.control}
                                            name="dep"
                                            render={({ field }) => (
                                                <FormItem className="w-full">
                                                    <FormControl>
                                                        <Input {...field} readOnly className="bg-zinc-800 border-zinc-800/90 text-white font-bold" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                                <div className="pl-[17px] flex flex-row gap-2">
                                    <div className={`w-full flex flex-row items-center gap-2`}>
                                        <p className=" text-white">Find Train (Select Destination):</p>
                                        <DeparturesComboBoxFormField onSubmit={onSubmit} _options={findUniquelyNamedDepartures(departures).map(station => ({ label: station.destination.name, value: station.destination.code }))} form={form} />
                                    </div>
                                </div>
                            </div>

                        </form>
                    </Form>
                </div>
            </div>
            <div className={`${maxWidthClassNames}  flex flex-col h-full justify-between`}>
                <div className="px-4 lg:px-12 pt-8 flex flex-col h-full gap-4">
                    <h2 className="font-semibold text-white">{aimStation.code ? "Results" : "Departing soon"}</h2>
                    <div className="flex flex-col gap-4">
                        {renderedDepartures.map((departure, index) => {
                            const { destination } = departure;
                            const selectedDepInfo = "T-" + departure.scheduledDepartureTime.replace(":", "") + "D-" + destination.code + (aimStation.code ? "A-" + aimStation.code : "");
                            if (departure.destination.name == "LOAD") return <div key={"load-" + index} className="bg-zinc-200 animate animate-pulse h-20 w-full"></div>
                            return <DepartureCard
                                status={departure.status}
                                key={departure.scheduledDepartureTime + departure.destination.name}
                                onClick={() => {
                                    setSelectedDepartures(
                                        // prev => addIfNewOrRemoveIfExistingItemFromArray(prev, selectedDepInfo)
                                        [selectedDepInfo]
                                    )
                                }}
                                className={`${selectedDepartures.includes(selectedDepInfo) ? "!bg-blue-300" : ""} ${noSelectionError && "animate-[shake] duration-700 animate-once transition-colors bg-red-400"}`}
                                partialDepartureInfo={{
                                    destination: departure.destination,
                                    scheduledDepartureTime: departure.scheduledDepartureTime.slice(0, 2) + ":" + departure.scheduledDepartureTime.slice(2),
                                    provider: departure.provider,
                                    via: aimStation.name || undefined
                                }} />
                        }
                        )
                        }
                    </div>
                </div>
                {/* <div className="grid place-items-center"> */}
                <Button
                    onClick={() => {
                        if (selectedDepartures.length == 0) { toast.error("Please select at least one departure"); setNoSelectionError("Please select at least one departure"); }
                        else { window.location.href = `/track?trains=${selectedDepartures.join("+")}` }
                    }}
                    className={`animate-in fixed bottom-12 left-[calc(50%_-_120px)] right-[calc(50%_-_120px)] text-center text-lg font-semibold ${selectedDepartures.length > 0 ? "bg-green-900 border-b-8 border-green-950 hover:border-b-0 -translate-y-2" : "opacity-0"}  px-12 py-8  transition-transform ease-in text-white`}>
                    Beat The Rush!
                    {/* {selectedDepartures.length > 0 && `(${selectedDepartures.length})` } */}
                </Button>
                {/* </div> */}
                <div className="bg-black text-white bottom-0 text-left w-full sticky flex justify-between">
                    <h3 className="font-normal">© Tye Goulder</h3>
                    {/* <h3 className="font-normal">BTR will soon be a paid service</h3> */}
                    <a href="/faq" className="underline">FAQ</a>
                </div>
            </div>
        </main >
    );
}
