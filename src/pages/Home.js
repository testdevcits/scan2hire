import { useMemo } from "react";
import QRCode from "react-qr-code";
import Header from "../components/Header";
import Footer from "../components/Footer";

const Home = () => {
  const formUrl = useMemo(() => `${window.location.origin}/form`, []);

  return (
    <div className="flex flex-col min-h-screen font-montserrat bg-light dark:bg-dark text-systemText">
      <Header />

      <main className="flex flex-col flex-1 items-center justify-center px-4 py-16 text-center space-y-8">
        <h1 className="text-4xl md:text-5xl font-bold animate-slide-fade-in">
          Welcome to Conative IT Solutions
        </h1>

        <p className="text-paragraph md:text-xl text-gray-700 dark:text-gray-300 animate-slide-fade-in">
          Scan the QR code at reception or click the button to fill your
          interview form.
        </p>

        <div className="bg-white p-6 rounded-xl shadow-md animate-slide-fade-in">
          <QRCode value={formUrl} size={150} />
        </div>

        <a
          href={formUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-primary hover:bg-primary/80 text-white font-medium py-3 px-6 rounded-xl transition-all duration-300 w-full md:w-auto text-center"
        >
          Fill the Form
        </a>
      </main>

      <Footer />
    </div>
  );
};

export default Home;
