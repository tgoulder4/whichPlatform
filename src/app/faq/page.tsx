import { Button } from '@/components/ui/button'
import React from 'react'

type Props = {}

function FAQPage({ }: Props) {
    function faq(q: string, a: string) {
        return <div>
            <h1 className='font-bold'>{q}</h1>
            <h2 className='max-w-sm'>{a}</h2>
        </div>
    }
    const faqs: { q: string, a: string }[] = [
        { q: 'What if the platform is wrong?', a: "In this rare case, the system will correct itself within 10 seconds. Feel free to contact me should this issue arise on multiple occasions." }
    ]
    return (
        <>
            <div className=" w-full h-full grid place-items-center text-white" >
                {faqs.map(f => faq(f.q, f.a))}
                <Button>

                    <a href="/find">Track</a>
                </Button>
            </div>
        </>

    )
}

export default FAQPage