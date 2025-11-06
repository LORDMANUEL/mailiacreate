import { Client } from 'jmap-client';

const JMAP_URL = '/jmap'; // Use a relative path to be proxied by Caddy

export const getClient = (username, password) => {
  return new Client({
    url: JMAP_URL,
    auth: {
      user: username,
      pass: password,
    },
  });
};

export const getMailboxes = async (client) => {
  const mailboxes = await client.getMailboxes();
  return mailboxes;
};

export const getEmails = async (client, mailboxId) => {
  const emails = await client.getEmails({
    filter: {
      inMailbox: mailboxId,
    },
    sort: [{ property: 'receivedAt', isAscending: false }],
    collapseThreads: true,
  });
  return emails;
};

export const getEmailContent = async (client, emailId) => {
    const email = await client.getEmails({
        ids: [emailId],
        properties: ['htmlBody', 'textBody', 'attachments'],
    });
    return email[0];
};
