import { useState, useEffect } from 'react';
import { getClient, getMailboxes, getEmails, getEmailContent } from '../lib/jmap';

// In a real application, you would get these from a secure authentication flow.
const USERNAME = process.env.NEXT_PUBLIC_JMAP_USERNAME;
const PASSWORD = process.env.NEXT_PUBLIC_JMAP_PASSWORD;

export default function Inbox() {
  const [client, setClient] = useState(null);
  const [mailboxes, setMailboxes] = useState([]);
  const [emails, setEmails] = useState([]);
  const [selectedMailbox, setSelectedMailbox] = useState(null);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [emailBody, setEmailBody] = useState('');

  useEffect(() => {
    // Initialize JMAP client
    if (USERNAME && PASSWORD) {
      const jmapClient = getClient(USERNAME, PASSWORD);
      setClient(jmapClient);
    }
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      if (client) {
        try {
          const fetchedMailboxes = await getMailboxes(client);
          setMailboxes(fetchedMailboxes);

          const inbox = fetchedMailboxes.find(m => m.role === 'inbox');
          if (inbox) {
            setSelectedMailbox(inbox);
          }
        } catch (error) {
          console.error('Error fetching initial data:', error);
        }
      }
    };
    fetchInitialData();
  }, [client]);

  useEffect(() => {
    const fetchEmailsForMailbox = async () => {
      if (client && selectedMailbox) {
        try {
          const fetchedEmails = await getEmails(client, selectedMailbox.id);
          setEmails(fetchedEmails);
          setSelectedEmail(fetchedEmails.length > 0 ? fetchedEmails[0] : null);
        } catch (error) {
          console.error(`Error fetching emails for ${selectedMailbox.name}:`, error);
        }
      }
    };
    fetchEmailsForMailbox();
  }, [selectedMailbox, client]);


  useEffect(() => {
    const fetchEmailBody = async () => {
      if (client && selectedEmail) {
        try {
          const emailDetails = await getEmailContent(client, selectedEmail.id);
          setEmailBody(emailDetails.htmlBody || emailDetails.textBody || '');
        } catch (error) {
          console.error(`Error fetching body for email ${selectedEmail.id}:`, error);
          setEmailBody('Could not load email content.');
        }
      } else {
        setEmailBody('');
      }
    };
    fetchEmailBody();
  }, [selectedEmail, client]);


  return (
    <div className="flex h-screen font-sans text-gray-900 bg-gray-50">
      {/* Left Panel: Mailboxes */}
      <aside className="w-64 bg-gray-100 border-r border-gray-200">
        <div className="p-4">
          <h1 className="text-2xl font-bold">MailKit</h1>
        </div>
        <nav className="p-2">
          <ul>
            {mailboxes.map((mailbox) => (
              <li key={mailbox.id}>
                <a
                  href="#"
                  onClick={() => setSelectedMailbox(mailbox)}
                  className={`flex justify-between items-center px-4 py-2 text-sm font-medium rounded-md ${
                    selectedMailbox && selectedMailbox.id === mailbox.id
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <span>{mailbox.name}</span>
                  {mailbox.unreadCount > 0 && (
                    <span className="px-2 py-1 text-xs font-bold text-white bg-indigo-600 rounded-full">
                      {mailbox.unreadCount}
                    </span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Middle Panel: Email List */}
      <section className="flex-1 min-w-0 bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <input
            type="search"
            placeholder="Search mail"
            className="w-full px-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <ul>
          {emails.map((email) => (
            <li
              key={email.id}
              onClick={() => setSelectedEmail(email)}
              className={`p-4 border-b border-gray-200 cursor-pointer ${
                selectedEmail && selectedEmail.id === email.id ? 'bg-indigo-50' : 'hover:bg-gray-100'
              } ${!email.isUnread ? '' : 'font-bold'}`}
            >
              <div className="flex justify-between">
                <p className="text-sm">{email.from[0].name || email.from[0].email}</p>
                <p className="text-xs text-gray-500">{new Date(email.receivedAt).toLocaleTimeString()}</p>
              </div>
              <p className="text-sm truncate">{email.subject}</p>
              <p className="text-xs text-gray-600 truncate">{email.preview}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Right Panel: Email Viewer */}
      <main className="flex-1 p-6 bg-white overflow-y-auto">
        {selectedEmail ? (
          <div>
            <h2 className="text-2xl font-bold mb-4">{selectedEmail.subject}</h2>
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 mr-4 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-500">
                {selectedEmail.from[0].name ? selectedEmail.from[0].name.charAt(0).toUpperCase() : ''}
              </div>
              <div>
                <p className="font-semibold">{selectedEmail.from[0].name || selectedEmail.from[0].email}</p>
                <p className="text-sm text-gray-600">To: me</p>
              </div>
            </div>
            <div
              className="prose"
              dangerouslySetInnerHTML={{ __html: emailBody }}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p>{selectedMailbox ? 'Select an email to read' : 'Select a mailbox to see emails'}</p>
          </div>
        )}
      </main>
    </div>
  );
}
