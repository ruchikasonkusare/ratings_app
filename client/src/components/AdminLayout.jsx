import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AdminLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <div className="logo-icon">★</div>
          <div>
            <h2>RatePoint</h2>
            <span>Admin Panel</span>
          </div>
        </div>

        <nav className="admin-nav">
          <NavLink
            to="/admin"
            end
            className={({ isActive }) =>
              isActive ? "admin-nav-link active" : "admin-nav-link"
            }
          >
            <span>⌂</span>
            Dashboard
          </NavLink>

          <NavLink
            to="/admin/users"
            className={({ isActive }) =>
              isActive ? "admin-nav-link active" : "admin-nav-link"
            }
          >
            <span>♙</span>
            Users
          </NavLink>

          <NavLink
            to="/admin/stores"
            className={({ isActive }) =>
              isActive ? "admin-nav-link active" : "admin-nav-link"
            }
          >
            <span>▣</span>
            Stores
          </NavLink>
        </nav>

        <div className="admin-sidebar-bottom">
          <div className="admin-user-mini">
            <div className="admin-avatar">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>

            <div>
              <strong>{user?.name}</strong>
              <span>Administrator</span>
            </div>
          </div>

          <button
            className="admin-logout"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="admin-main">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;