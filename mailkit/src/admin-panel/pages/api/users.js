import { getSession } from 'next-auth/react';
import axios from 'axios';

// --- Configuración de Keycloak ---
const KEYCLOAK_URL = process.env.KEYCLOAK_ISSUER.split('/realms')[0];
const REALM = 'mailkit';
const ADMIN_CLIENT_ID = process.env.KEYCLOAK_ADMIN_CLIENT_ID || 'admin-cli'; // Un cliente con permisos de admin
const ADMIN_CLIENT_SECRET = process.env.KEYCLOAK_ADMIN_CLIENT_SECRET || 'changeme';


/**
 * Obtiene un token de acceso de administrador para la API de Keycloak.
 */
async function getAdminAccessToken() {
  const params = new URLSearchParams();
  params.append('client_id', ADMIN_CLIENT_ID);
  params.append('client_secret', ADMIN_CLIENT_SECRET);
  params.append('grant_type', 'client_credentials');

  const response = await axios.post(`${KEYCLOAK_URL}/realms/master/protocol/openid-connect/token`, params);
  return response.data.access_token;
}


/**
 * El manejador principal de la API para gestionar usuarios en Keycloak.
 */
export default async function handler(req, res) {
  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const accessToken = await getAdminAccessToken();
    const headers = { Authorization: `Bearer ${accessToken}` };
    const usersApiUrl = `${KEYCLOAK_URL}/admin/realms/${REALM}/users`;

    switch (req.method) {
      case 'GET':
        const { data: users } = await axios.get(usersApiUrl, { headers });
        res.status(200).json(users.map(u => ({ id: u.id, email: u.email, status: u.enabled ? 'active' : 'disabled' })));
        break;

      case 'POST':
        // Lógica para crear un usuario
        const { email, password } = req.body;
        const { data: newUser } = await axios.post(usersApiUrl, {
          username: email,
          email: email,
          enabled: true,
          credentials: [{ type: 'password', value: password, temporary: false }],
        }, { headers });
        res.status(201).json(newUser);
        break;

      case 'DELETE':
        // Lógica para eliminar un usuario
        const { userId } = req.query;
        await axios.delete(`${usersApiUrl}/${userId}`, { headers });
        res.status(204).end();
        break;

      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Keycloak API Error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to communicate with Keycloak' });
  }
}
