import { useState } from 'react';

const ComposeModal = ({ onSend, onClose }) => {
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    setIsSending(true);
    try {
      await onSend({ to, subject, body });
      onClose(); // Cierra el modal si el envío es exitoso
    } catch (error) {
      alert('Failed to send email: ' + error.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="bg-gray-100 px-4 py-2 flex justify-between items-center rounded-t-lg">
          <h2 className="text-lg font-semibold">New Message</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">&times;</button>
        </div>
        <form onSubmit={handleSend}>
          <div className="p-4 space-y-3">
            <div>
              <input
                type="email"
                placeholder="To"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full px-3 py-2 border-b border-gray-200 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 border-b border-gray-200 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <textarea
                placeholder="Your message..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full h-64 px-3 py-2 focus:outline-none"
                required
              ></textarea>
            </div>
          </div>
          <div className="px-4 py-3 bg-gray-50 flex justify-end rounded-b-lg">
            <button
              type="submit"
              disabled={isSending}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400"
            >
              {isSending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ComposeModal;
