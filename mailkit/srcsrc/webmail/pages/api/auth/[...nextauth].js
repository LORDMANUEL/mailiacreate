import NextAuth from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";

// Estas variables de entorno deben estar definidas en tu entorno
const KEYCLOAK_ISSUER = process.env.KEYCLOAK_ISSUER || 'https://sso.tudominio.com/realms/mailkit';
const KEYCLOAK_CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID || 'webmail';
const KEYCLOAK_CLIENT_SECRET = process.env.KEYCLOAK_CLIENT_SECRET || 'changeme'; // Obtener esto de la UI de Keycloak

export default NextAuth({
  providers: [
    KeycloakProvider({
      clientId: KEYCLOAK_CLIENT_ID,
      clientSecret: KEYCLOAK_CLIENT_SECRET,
      issuer: KEYCLOAK_ISSUER,
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Persiste el token de acceso de OAuth en el token JWT
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      // Envía el token de acceso a la sesión del cliente
      session.accessToken = token.accessToken;
      return session;
    },
  },
});
