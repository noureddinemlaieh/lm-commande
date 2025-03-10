import Sidebar from '../components/Sidebar';

function MyApp({ Component, pageProps }) {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <Component {...pageProps} />
      </main>
    </div>
  );
}

export default MyApp; 