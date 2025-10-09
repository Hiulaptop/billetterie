'use client'
import { use } from 'react'

export default function EventPage({
  params,
}: {
    params: Promise<{ slug: string }>
}) {

    const { id } : any = use(params)
    return (
        <div>
            {id}
        </div>
    );

}