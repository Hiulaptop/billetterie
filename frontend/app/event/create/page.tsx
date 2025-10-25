"use client"
import {useEffect, useState} from "react";
import { useRouter } from 'next/navigation';

export default function CreatePage() {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [title, setTitle] = useState<string>('');
    const [description, setDescription] = useState<string>('');
    const [file, setFile] = useState<File | null>(null);

    const router = useRouter();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // 1. Get the JWT token from localStorage
        const token = localStorage.getItem('token');
        if (!token) {
            setError('You are not logged in.');
            setLoading(false);
            return;
        }

        // 2. Check if a file was selected
        if (!file) {
            setError('Thumbnail image is required.');
            setLoading(false);
            return;
        }

        // 3. Create a FormData object to send multipart data
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('thumbnail', file); // The file object

        // 4. Send the request
        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/events`;

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    // 'Content-Type' is set automatically by the browser for FormData
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create event.');
            }

            // Success!
            alert('Event created successfully!');
            router.push('/'); // Or wherever you want to redirect

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return(
        <div>
            <h1>Create New Event</h1>
            <p>(Admin Only)</p>

            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="title">Event Title:</label>
                    <br />
                    <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                </div>

                <br />

                <div>
                    <label htmlFor="description">Event Description:</label>
                    <br />
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                    />
                </div>

                <br />

                <div>
                    <label htmlFor="thumbnail">Thumbnail Image:</label>
                    <br />
                    <input
                        type="file"
                        id="thumbnail"
                        accept="image/*" // Only accept image files
                        onChange={handleFileChange}
                        required
                    />
                </div>

                <br />

                {/* Display errors here */}
                {error && <p style={{ color: 'red' }}>{error}</p>}

                <button type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Event'}
                </button>
            </form>
        </div>
    );

}