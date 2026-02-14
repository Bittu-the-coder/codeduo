import { env } from '$env/dynamic/private';

const API_URL =
  env.API_URL || env.VITE_API_URL || 'http://localhost:3001/api';

export const load = async ({ params, cookies }) => {
  const roomId = params.id;
  const accessToken = cookies.get('accessToken');

  // Get current user if logged in
  let user = null;
  if (accessToken) {
    try {
      const userResponse = await fetch(`${API_URL}/users/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (userResponse.ok) {
        const userData = await userResponse.json();
        user = userData.data;
      }
    } catch {
      // ignore
    }
  }

  // Try to find if this room ID works as a Project ID
  // Valid MongoDB ObjectId is 24 hex chars
  let project = null;
  if (roomId.match(/^[0-9a-fA-F]{24}$/)) {
    try {
      const headers: Record<string, string> = {};
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(`${API_URL}/projects/${roomId}`, {
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        project = data.data;
      }
    } catch {
      // ignore error, might just be a random room string
    }
  }

  return {
    roomId,
    project,
    user,
  };
};
