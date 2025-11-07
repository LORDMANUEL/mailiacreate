import NextAuth from "next-auth"
import KeycloakProvider from "next-auth/providers/keycloak";

// Note: In a real deployment, these should be environment variables.
const KEYCLOAK_ISSUER = process.env.KEYCLOAK_ISSUER || 'https://sso.tudominio.com/realms/mailkit';
const KEYCLOAK_CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID || 'it-panel';
const KEYCLOAK_CLIENT_SECRET = process.env.KEYCLOAK_CLIENT_SECRET || 'changeme'; // Get this from Keycloak UI

export default NextAuth({
  providers: [
    KeycloakProvider({
      clientId: KEYCLOAK_CLIENT_ID,
      clientSecret: KEYCLOAK_CLIENT_SECRET,
      issuer: KEYCLOAK_ISSUER,
    })
  ],
});
