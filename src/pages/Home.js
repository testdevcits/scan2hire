import { useEffect, useState, useRef } from "react";
import QRCode from "react-qr-code";
import { FiRefreshCw } from "react-icons/fi";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { generateQrId } from "../api/index";

const Home = () => {
  const [formUrl, setFormUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetched = useRef(false);

  const fetchQr = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await generateQrId();

      const qrId = res?.data?.qrId;

      if (!res.success || !qrId) {
        throw new Error(res.message || "Failed to generate QR ID");
      }

      const baseUrl = window.location.origin;

      setFormUrl(`${baseUrl}/form/${qrId}`);
    } catch (err) {
      console.error("QR Generation Error:", err);
      setError("Failed to generate QR. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    fetchQr();
  }, []);

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

        {loading && (
          <p className="text-gray-500 animate-pulse">Generating QR code...</p>
        )}

        {error && <p className="text-red-500">{error}</p>}

        {!loading && !error && formUrl && (
          <>
            <div className="bg-white p-6 rounded-xl shadow-md animate-slide-fade-in">
              <QRCode value={formUrl} size={150} />
            </div>

            <div className="flex flex-col md:flex-row items-center justify-center space-y-3 md:space-y-0 md:space-x-4 mt-4">
              <button
                onClick={fetchQr}
                className="flex items-center space-x-2 bg-primary hover:bg-primary/80 text-white font-medium py-3 px-4 rounded-xl transition-all duration-300 w-full md:w-auto justify-center"
              >
                <FiRefreshCw size={20} />
                <span>Regenerate QR</span>
              </button>

              <a
                href={formUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary hover:bg-primary/80 text-white font-medium py-3 px-6 rounded-xl transition-all duration-300 w-full md:w-auto text-center"
              >
                Fill the Form
              </a>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Home;
