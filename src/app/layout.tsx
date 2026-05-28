import type { ReactElement, ReactNode } from 'react';

export const metadata = {
  title: 'Ranked AA Reference Agent',
  description: 'Reference AI agent for Ranked AA',
};

const RootLayout = ({ children }: { children: ReactNode }): ReactElement => (
  <html lang="ja">
    <body>{children}</body>
  </html>
);

export default RootLayout;
