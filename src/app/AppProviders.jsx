import { ApiProvider } from "../contexts/ApiContext";
import { AuthProvider } from "../contexts/AuthContext";
import { CandidateProvider } from "../contexts/CandidateContext";
import { EmployeeProvider } from "../contexts/EmployeeContext";
import { ModalProvider } from "../contexts/ModalContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import { ToastProvider } from "../contexts/ToastContext";

export default function AppProviders({ children }) {
  return (
    <ThemeProvider>
      <ApiProvider>
        <AuthProvider>
          <ToastProvider>
            <ModalProvider>
              <CandidateProvider>
                <EmployeeProvider>{children}</EmployeeProvider>
              </CandidateProvider>
            </ModalProvider>
          </ToastProvider>
        </AuthProvider>
      </ApiProvider>
    </ThemeProvider>
  );
}
