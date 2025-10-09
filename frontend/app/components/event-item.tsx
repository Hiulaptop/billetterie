'use client'
import Image from "next/image";
import Link from 'next/link'

export default function  EventItem(item: any){

    return(
        <Link
            key={item.id}
            className="flex flex-col max-w-[48rem] h-96 rounded-xl text-left inset-shadow-xs bg-slate-50"
            // onClick={() => {alert(item.id)}}
            href={`/event/${item.id}`}
        >
            <div className="h-48 w-full content-center text-center rounded-t-xl ">
                Image Here
                {/*<Image src={item.image ? ""} className="w-full" />*/}
            </div>
            <div className="flex flex-col h-48 pt-2 p-4 gap-0.5">
                <div className="text-[1.37rem] font-bold text-wrap h-20 ">
                    {/*// event name here*/}
                    LacaSoak - B&W DARKROOM WORKSHOP - WORKSHOP RỌI ẢNH TRẮNG ĐEN
                </div>
                <div className="text-md font-bold text-wrap content-center h-6 ">
                    calendar here
                </div>
                <div className="flex-1 flex flex-row " >
                    <div className="flex-1 text-md font-bold text-wrap content-center ">
                        Position here
                    </div>
                    <div className="self-end " >
                        Price here
                    </div>
                </div>
            </div>
        </Link>
    );
}
