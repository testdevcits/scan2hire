// Footer.jsx
const Footer = () => {
  const currentYear = new Date().getFullYear(); // Get the current year dynamically

  return (
    <footer className="w-full bg-header dark:bg-dark text-systemText p-4 mt-auto">
      <div className="max-w-6xl mx-auto text-center text-sm font-bold animate-slide-fade-in">
        &copy; {currentYear} Conative IT Solutions. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
