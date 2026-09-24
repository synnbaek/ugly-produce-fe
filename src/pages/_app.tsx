import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { RoleProvider } from '@/lib/RoleContext';
import { ToastProvider } from '@/components/Toast';
import { Topbar } from '@/components/Topbar';
import { ArchObserver } from '@/components/ArchObserver';
import Head from 'next/head';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <RoleProvider>
      <ToastProvider>
        <Head>
          <title>못난이 농산물 공동구매 플랫폼 — Frontend Prototype</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        </Head>
        <Topbar />
        <main id="app">
          <Component {...pageProps} />
        </main>
        <ArchObserver />
      </ToastProvider>
    </RoleProvider>
  );
}
