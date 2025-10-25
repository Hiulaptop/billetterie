'use client'
import { useState } from "react";
import { useRouter } from "next/navigation";

type LoginResponse = {
    access_token: string;
};

type ErrorResponse = {
    message: string;
    error: string;
    statusCode: number;
};

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const router = useRouter();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setError(null);

        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/login`;
        console.log('Attempting to log in at:', apiUrl);
        try {
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            if (!response.ok) {
                const errorData: ErrorResponse   = await response.json();
                throw new Error(errorData.message || 'Login failed. Please check your credentials.');
            }

            const data: LoginResponse = await response.json();
            localStorage.setItem("token", data.access_token);
        }
        catch (error : any) {
            setError(error.message);
        }
        finally {
            setLoading(false);
            router.push("/");
        }
    }

        return(
            <div>
                <form onSubmit={handleSubmit}>
                    <h1>Login</h1>

                    <div >
                        <label htmlFor="username">Username</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && <p >{error}</p>}

                    <button type="submit" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
            </div>
        );
}