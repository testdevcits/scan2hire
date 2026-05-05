import { useEffect, useState } from "react";
import logo from "../assets/logo.png"; // Place your logo inside src/assets/logo.png

const Header = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate header on mount
    setIsVisible(true);
  }, []);

  return (
    <header
      className={`w-full bg-white dark:bg-dark text-systemText shadow-md px-3 py-3 sm:p-4 transition-colors duration-300 ${
        isVisible ? "animate-slide-fade-in" : "opacity-0"
      }`}
    >
      <div className="max-w-6xl mx-auto flex justify-between items-center gap-3">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-2">
          <img
            src={logo}
            alt="Conative IT Logo"
            className="w-9 h-9 sm:w-10 sm:h-10 object-contain shrink-0"
          />
          <h2 className="text-base xs:text-lg sm:text-2xl leading-tight font-bold text-primary dark:text-red-500">
            Conative IT Solutions
          </h2>
        </div>

        {/* Navigation */}
        <nav className="space-x-4 hidden md:flex">
          <a
            href="/"
            className="hover:text-primary dark:hover:text-red-500 transition-colors"
          >
            Home
          </a>
          <a
            href="/login"
            className="hover:text-primary dark:hover:text-red-500 transition-colors"
          >
            Admin
          </a>
        </nav>
      </div>
    </header>
  );
};

export default Header;
