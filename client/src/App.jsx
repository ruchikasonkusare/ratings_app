import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";

import Login from "./pages/Login";
import Register from "./pages/Register";

import ProtectedRoute from "./components/ProtectedROutes";
import UserDashboard from "./pages/user/UserDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUserDetails from "./pages/admin/AdminUserDetails";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminStores from "./pages/admin/AdminStores";
import AdminStoreDetails from "./pages/admin/AdminStoreDetails";
import OwnerDashboard from "./pages/owner/OwnerDashboard";

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/register"
            element={<Register />}
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminUsers />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/stores"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminStores />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/stores/:id"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminStoreDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="/user"
            element={
              <ProtectedRoute allowedRoles={["USER"]}>
                <UserDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/owner"
            element={
              <ProtectedRoute allowedRoles={["OWNER"]}>
                <OwnerDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users/:id"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminUserDetails />
              </ProtectedRoute>
            }
          />

          <Route
            path="/"
            element={
              <Navigate to="/login" replace />
            }
          />

          <Route
            path="*"
            element={
              <Navigate to="/login" replace />
            }
          />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;