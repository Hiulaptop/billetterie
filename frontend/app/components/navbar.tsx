import Link from "next/link";
import Image from 'next/image';
import Logo from '@/public/Logo.svg'

export function Navbar() {
    return(
        <nav
            className="z-100 sticky top-0 shadow-xl bg-white"
        >
            <div
                className="container mx-auto h-16 w-full  flex place-items-center gap-4"
            >
                <Image className="h-full w-auto" src={Logo} alt={""}/>
                <a
                    className="ml-auto"
                    href="/auth/login/"
                >
                    LogIn
                </a>
                <a
                    className=""
                    href="/auth/signup"
                >
                    SignUp
                </a>
            </div>
        </nav>
    );
}