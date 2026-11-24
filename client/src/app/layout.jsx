import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/theme.css';
import '../styles/sqa.css';

import { AuthProvider } from '../context/AuthContext';
import { ToastContainer } from 'react-toastify';

export const metadata = {
  title: 'Recruitment Portal - Staffing & Placement System',
  description: 'Enterprise recruitment, company verification, and candidate placement platform.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
          <ToastContainer
            position="top-right"
            autoClose={3500}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
          />
        </AuthProvider>
      </body>
    </html>
  );
}
