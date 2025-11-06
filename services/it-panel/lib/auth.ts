import NextAuth from 'next-auth';
import Keycloak from 'next-auth/providers/keycloak';

const issuer = process.env.KEYCLOAK_ISSUER || 'https://sso.example.com/realms/mailiacreate';
const clientId = process.env.KEYCLOAK_CLIENT_ID || 'mail-suite-it';
const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET || 'change_me';

export const { auth, handlers } = NextAuth({
  session: { strategy: 'jwt' },
  providers: [
    Keycloak({
      issuer,
      clientId,
      clientSecret
    })
  ],
  pages: {
    signIn: '/(auth)/login'
  }
});
