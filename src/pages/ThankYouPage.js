// src/pages/ThankYouPage.js
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";

const ThankYouPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state) {
    navigate("/form");
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen font-montserrat bg-light dark:bg-dark text-systemText">
      <Header />
      <main className="flex flex-col flex-1 items-center justify-center px-4 py-16">
        <div className="bg-white dark:bg-gray-800 max-w-md w-full p-6 rounded-xl shadow-md text-center space-y-4">
          <h2 className="text-4xl font-bold mb-2 text-green-600">
            Thank You, {state.name}!
          </h2>
          <p className="text-gray-700 dark:text-gray-300 text-lg">
            Your email has been verified successfully.
          </p>
          <p className="text-gray-700 dark:text-gray-300 text-lg">
            Your Candidate ID: <strong>{state.qrId}</strong>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ThankYouPage;
