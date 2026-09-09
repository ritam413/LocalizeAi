import type { Metadata } from 'next';
import './globals.css';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'LOCALIZE Studio — Autonomous AI Post-Production Crew',
  description: 'Autonomous AI post-production crew for film and video localization powered by Google Cloud Gemini and Grafana observability.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
