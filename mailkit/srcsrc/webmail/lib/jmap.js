import { Client } from 'jmap-jam';

const JMAP_URL = '/jmap'; // Use a relative path to be proxied by Caddy

export const getClient = (username, password) => {
  // jmap-jam uses a different initialization pattern
  const client = new Client({
    url: JMAP_URL,
    auth: {
      username: username,
      password: password,
    },
  });
  return client;
};

// Note: The following function signatures are adapted based on common JMAP client patterns.
// The exact implementation may vary slightly with the jmap-jam library.

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
