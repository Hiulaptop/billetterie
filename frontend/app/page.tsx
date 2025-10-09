import React from "react";
// import Image from "next/image";
import EventItem from "@/app/components/event-item";

export default function Home() {
    const data = [
        {
            id: 1,
        },
        {
            id: 2,
        },
        {
            id: 3,
        },
        {
            id: 4,
        },
        {
            id: 5,
        },
        {
            id: 6,
        },
        {
            id: 7,
        },
        {
            id: 8,
        },
        {
            id: 9,
        },
        {
            id: 10,
        },
        {
            id: 11,
        },
    ]

  return (
    <div
        className="container mx-auto flex flex-col "
    >

        <div
            className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-8 w-auto min-w-full mx-auto"
        >
            {
                data.map((item) => (
                    <EventItem key={item.id} id={item.id}/>
                ))
            }
        </div>
    </div>
  );
}
