import "./globals.css";

export const metadata = {
  title: "YouTube Content Planner",
  description: "Simple content planning tool for a YouTube channel",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <a href="/" className="site-title">
            YouTube Content Planner
          </a>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
