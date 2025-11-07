import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getClient, getMailboxes, getEmails, getEmailContent } from '../lib/jmap';

// Componente de la Bandeja de Entrada
const InboxPage = () => {
  const { data: session, status } = useSession({ required: true });

  const [client, setClient] = useState(null);
  const [mailboxes, setMailboxes] = useState([]);
  const [emails, setEmails] = useState([]);
  const [selectedMailbox, setSelectedMailbox] = useState(null);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [emailBody, setEmailBody] = useState('');
  const [error, setError] = useState(null);

  // --- Inicialización y Lógica de Datos ---

  useEffect(() => {
    if (status === 'authenticated' && session.accessToken) {
      // Inicializar el cliente JMAP con el token de acceso de Keycloak
      const jmapClient = getClient(session.user.email, session.accessToken);
      setClient(jmapClient);
    }
  }, [session, status]);

  const fetchMailboxes = async () => {
    if (!client) return;
    try {
      const fetchedMailboxes = await getMailboxes(client);
      setMailboxes(fetchedMailboxes);
      const inbox = fetchedMailboxes.find(m => m.role === 'inbox');
      if (inbox) setSelectedMailbox(inbox);
    } catch (err) {
      setError('Failed to fetch mailboxes.');
    }
  };

  const fetchEmails = async () => {
    if (!client || !selectedMailbox) return;
    try {
      const fetchedEmails = await getEmails(client, selectedMailbox.id);
      setEmails(fetchedEmails);
    } catch (err) {
      setError('Failed to fetch emails.');
    }
  };

  useEffect(() => {
    fetchMailboxes();
  }, [client]);

  useEffect(() => {
    fetchEmails();
  }, [selectedMailbox]);

  // --- Acciones del Usuario ---

  const handleNewEmail = () => {
    // Lógica para abrir un modal de composición de correo
    alert('Función "Nuevo Correo" por implementar.');
  };

  const handleDeleteEmail = async () => {
    if (!client || !selectedEmail) return;
    if (confirm('Are you sure you want to delete this email?')) {
      try {
        // En JMAP, la eliminación es un cambio que mueve el correo a la papelera o lo destruye
        await client.emails.set({
          destroy: [selectedEmail.id],
        });
        alert('Email deleted successfully.');
        fetchEmails(); // Refrescar la lista de correos
      } catch (err) {
        setError('Failed to delete email.');
      }
    }
  };


  if (status === 'loading') {
    return <div>Loading session...</div>;
  }

  return (
    <div className="flex h-screen font-sans text-gray-900 bg-gray-50">
      {/* Panel Izquierdo: Buzones */}
      <aside className="w-64 bg-gray-100 border-r border-gray-200">
        <div className="p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">MailKit</h1>
          <button onClick={handleNewEmail} className="px-3 py-1 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700">New</button>
        </div>
        {/* ... renderizado de la lista de buzones ... */}
      </aside>

      {/* Panel Central: Lista de Correos */}
      <section className="flex-1 min-w-0 bg-white border-r border-gray-200">
        {/* ... renderizado de la lista de correos ... */}
      </section>

      {/* Panel Derecho: Visor de Correos */}
      <main className="flex-1 p-6 bg-white overflow-y-auto">
        {selectedEmail && (
          <div className="flex justify-end mb-4">
            <button onClick={handleDeleteEmail} className="px-3 py-1 bg-red-600 text-white rounded-md text-sm hover:bg-red-700">Delete</button>
          </div>
        )}
        {/* ... renderizado del cuerpo del correo ... */}
      </main>
    </div>
  );
};

// Esta línea asegura que la página requiera autenticación
InboxPage.auth = true;

export default InboxPage;
