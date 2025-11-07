import { signIn } from 'next-auth/react';

export default function LoginPage() {
  const handleSignIn = (e) => {
    e.preventDefault();
    // Inicia el flujo de inicio de sesión de Keycloak.
    // NextAuth redirigirá al usuario a Keycloak y luego de vuelta a la página de la bandeja de entrada.
    signIn('keycloak', { callbackUrl: '/inbox' });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center text-gray-900">
          MailKit Webmail
        </h1>
        <p className="text-center text-gray-600">
          Inicia sesión de forma segura a través del SSO.
        </p>
        <button
          onClick={handleSignIn}
          className="w-full px-4 py-3 text-lg font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Iniciar Sesión con SSO
        </button>
      </div>
    </div>
  );
}
