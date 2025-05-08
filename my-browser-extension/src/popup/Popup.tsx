import React, { useState, useEffect } from 'react';

const Popup = () => {
    const [passwords, setPasswords] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch saved passwords from storage or API
        const fetchPasswords = async () => {
            // Simulating an API call
            const savedPasswords = await new Promise(resolve => {
                setTimeout(() => {
                    resolve([
                        { id: 1, site: 'example.com', username: 'user1', password: 'pass1' },
                        { id: 2, site: 'example.org', username: 'user2', password: 'pass2' },
                    ]);
                }, 1000);
            });
            setPasswords(savedPasswords);
            setLoading(false);
        };

        fetchPasswords();
    }, []);

    return (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
            <h1 className="text-xl font-bold mb-4">Saved Passwords</h1>
            {loading ? (
                <p>Loading...</p>
            ) : (
                <ul className="space-y-2">
                    {passwords.map(({ id, site, username }) => (
                        <li key={id} className="p-2 border rounded-md bg-gray-100 dark:bg-gray-700">
                            <div className="flex justify-between">
                                <div>
                                    <p className="font-semibold">{site}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{username}</p>
                                </div>
                                <button className="text-blue-500 hover:underline">Copy</button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default Popup;