import { useEffect, useState } from 'react';

// Development URL - change this when you deploy
const TOKEN_SERVER_URL = 'http://localhost:8000/token';

interface ConnectionDetails {
  url: string;
  token: string;
  roomName?: string;
}

export function useVoiceAgentConnection(): { details: ConnectionDetails | undefined; isLoading: boolean; error: string | null } {
  const [details, setDetails] = useState<ConnectionDetails | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConnectionDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Make request to YOUR FastAPI server
        
        // What's happening:
        // fetch - Makes HTTP request to your FastAPI server
        // POST method - Sending data (more secure than GET for auth)
        // Headers - Tell server what type of data we're sending
        // Body - The actual data (user ID) converted to JSON string
        const response = await fetch(TOKEN_SERVER_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: `user-${Date.now()}` // Simple unique user ID for MVP
          })
        });

        // Check response status
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Parse JSON response
        const data = await response.json();

        // Map YOUR response format to what LiveKit expects
        setDetails({
          url: data.server_url,
          token: data.token,
          roomName: data.room_name
        });

      } catch (err) {
        console.error('Token fetch error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchConnectionDetails();
  }, []); // Empty dependency array = run once when component mounts

  return { details, isLoading, error };
}
