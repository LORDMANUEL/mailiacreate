import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getClient, getMailboxes, getEmails, sendEmail, deleteEmail } from '../lib/jmap';
import ComposeModal from '../components/ComposeModal';

const InboxPage = () => {
  const { data: session, status } = useSession({ required: true });

  const [client, setClient] = useState(null);
  const [mailboxes, setMailboxes] = useState([]);
  const [emails, setEmails] = useState([]);
  const [selectedMailbox, setSelectedMailbox] = useState(null);
  // ... (otros estados)
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  // --- Inicialización y Lógica de Datos (sin cambios) ---
  useEffect(() => {
    if (status === 'authenticated' && session.accessToken) {
      const jmapClient = getClient(session.user.email, session.accessToken);
      setClient(jmapClient);
    }
  }, [session, status]);

  // ... (fetchMailboxes, fetchEmails)

  // --- Acciones del Usuario ---

  const handleSendEmail = async (email) => {
    if (!client) return;
    try {
      await sendEmail(client, email);
      alert('Email sent successfully!');
      // Opcional: refrescar el buzón de 'Sent'
    } catch (err) {
      throw new Error('Failed to send email.');
    }
  };

  const handleDeleteEmail = async () => {
    if (!client || !selectedEmail) return;
    if (confirm('Are you sure you want to move this email to Trash?')) {
      try {
        await deleteEmail(client, selectedEmail.id);
        alert('Email moved to Trash.');
        fetchEmails(); // Refrescar la lista
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
      {isComposeOpen && <ComposeModal onSend={handleSendEmail} onClose={() => setIsComposeOpen(false)} />}

      {/* Panel Izquierdo: Buzones */}
      <aside className="w-64 bg-gray-100 border-r border-gray-200">
        <div className="p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">MailKit</h1>
          <button onClick={() => setIsComposeOpen(true)} className="px-3 py-1 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700">New</button>
        </div>
        {/* ... renderizado de la lista de buzones ... */}
      </aside>

      {/* Panel Central: Lista de Correos */}
      {/* ... (sin cambios) */}

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

InboxPage.auth = true;

export default InboxPage;
