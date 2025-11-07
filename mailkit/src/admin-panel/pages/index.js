import { useState, useEffect } from 'react';

const AdminGuide = () => {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold">Guía del Panel de Administración</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Gestión de Usuarios y Dominios</h2>
          <div className="prose">
            <p>
              En la arquitectura actual de la MailKit Rust Suite, la gestión de la identidad (usuarios, contraseñas y roles) está centralizada en **Keycloak**.
            </p>
            <p>
              Stalwart, el servidor de correo, está configurado para usar Keycloak como su proveedor de identidad a través de OIDC. Esto significa que los usuarios que crees en Keycloak podrán iniciar sesión automáticamente en los servicios de correo.
            </p>

            <h3 className="mt-6">Cómo Gestionar Usuarios:</h3>
            <ol>
              <li>Navega a la consola de administración de Keycloak en <strong><a href={`https://sso.${process.env.NEXT_PUBLIC_DOMAIN || 'tudominio.com'}`} target="_blank" rel="noopener noreferrer">sso.{"{"}{process.env.NEXT_PUBLIC_DOMAIN || 'tudominio.com'}{"}"}</a></strong>.</li>
              <li>Inicia sesión con tus credenciales de administrador de Keycloak.</li>
              <li>Asegúrate de estar en el realm <strong>mailkit</strong>.</li>
              <li>Ve a la sección "Users" en el menú de la izquierda para crear, editar o eliminar usuarios.</li>
            </ol>

            <h3 className="mt-6">Integración Futura:</h3>
            <p>
              Este panel de administración está destinado a convertirse en una interfaz unificada que interactúe directamente con las APIs de Keycloak y Stalwart. Sin embargo, en la fase actual del proyecto, la gestión debe realizarse directamente en las herramientas correspondientes.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

AdminGuide.auth = true; // Todavía requiere autenticación para acceder a esta guía
export default AdminGuide;
