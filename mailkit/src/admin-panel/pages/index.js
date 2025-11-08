import { useState, useEffect } from 'react';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '' });

  // --- Lógica de Datos contra el BFF de Next.js ---

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/users'); // Llama al BFF
      if (!response.ok) throw new Error('Failed to fetch users from Keycloak');
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      });
      if (!response.ok) throw new Error('Failed to create user in Keycloak');
      setShowCreateForm(false);
      setNewUser({ email: '', password: '' });
      fetchUsers(); // Refrescar
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to permanently delete this user?')) {
      try {
        const response = await fetch(`/api/users?userId=${userId}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete user in Keycloak');
        fetchUsers(); // Refrescar
      } catch (err) {
        setError(err.message);
      }
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);


  // --- Render ---
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <header className="bg-white shadow-sm">
        {/* ... (sin cambios) */}
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6" role="alert">
          <p className="font-bold">Sistema Integrado</p>
          <p>Este panel ahora gestiona usuarios reales directamente en Keycloak.</p>
        </div>

        {/* ... (Formulario de creación y tabla de usuarios, adaptados para el nuevo `newUser` state) */}

      </main>
    </div>
  );
};

AdminPanel.auth = true;
export default AdminPanel;
