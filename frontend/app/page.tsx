"use client"
import React, {useEffect, useState} from "react";
// import Image from "next/image";
import EventItem from "@/app/components/event-item";

type Event = {
    id: number;
    title: string;
    description: string;
};

export default function Home() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // 2. Fetch data inside the useEffect hook
    useEffect(() => {
        // Define an async function inside the effect
        const fetchEvents = async () => {
            try {
                // Your NestJS backend URL
                const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/events`;

                const response = await fetch(apiUrl);

                if (!response.ok) {
                    throw new Error('Failed to fetch events.');
                }

                const data: Event[] = await response.json();
                setEvents(data); // Set the data in state

            } catch (err: any) {
                setError(err.message); // Set the error state
            } finally {
                setLoading(false); // Stop loading, regardless of success or error
            }
        };

        // Call the function
        fetchEvents();

    }, []);



    if (loading) {
        return <p>Loading events...</p>;
    }

    if (error) {
        return <p style={{ color: 'red' }}>Error: {error}</p>;
    }

  return (
    <div
        className="container mx-auto flex flex-col "
    >

        <div
            className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-8 w-auto min-w-full mx-auto"
        >
            {
                events.map((item) => (
                    <EventItem key={item.id} id={item.id}/>
                ))
            }
        </div>
    </div>
  );
}
