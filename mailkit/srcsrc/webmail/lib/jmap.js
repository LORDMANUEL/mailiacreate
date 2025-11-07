import { Client } from 'jmap-jam';

const JMAP_URL = '/jmap'; // Ruta relativa para el proxy de Caddy

/**
 * Crea una nueva instancia del cliente JMAP.
 * Se autentica usando el flujo OAuth 2.0 (Bearer Token).
 *
 * @param {string} username - El nombre de usuario (email).
 * @param {string} accessToken - El token de acceso JWT de Keycloak.
 */
export const getClient = (username, accessToken) => {
  const client = new Client({
    url: JMAP_URL,
    auth: {
      username: username,
      // Se usa el token de acceso como una contraseña de un solo uso.
      // Stalwart está configurado para aceptar esto.
      password: accessToken,
      method: 'token' // Esto puede variar según la biblioteca, conceptualmente es un token.
    },
  });
  return client;
};


// --- Funciones de la API de JMAP ---

export const getMailboxes = async (client) => {
  const { mailboxes } = await client.mailboxes.get();
  return mailboxes;
};

export const getEmails = async (client, mailboxId) => {
  const { emails } = await client.emails.get({
    filter: {
      inMailbox: mailboxId,
    },
    sort: [{ property: 'receivedAt', isAscending: false }],
  });
  return emails;
};

export const getEmailContent = async (client, emailId) => {
    const { emails } = await client.emails.get({
        ids: [emailId],
        properties: ['htmlBody', 'textBody', 'attachments'],
    });
    return emails[0];
};

// Nota: Las funciones de escritura (set) se añadirían aquí.
// Ejemplo:
// export const deleteEmail = async (client, emailId) => {
//   await client.emails.set({
//     destroy: [emailId],
//   });
// };
