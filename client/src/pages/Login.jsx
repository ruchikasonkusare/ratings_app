import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Star,
  Store,
} from "lucide-react";

import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email: form.email.trim(),
        password: form.password,
      });

      const { token, user } = response.data;

      login(user, token);

      if (user.role === "ADMIN") {
        navigate("/admin", { replace: true });
      } else if (user.role === "OWNER") {
        navigate("/owner", { replace: true });
      } else {
        navigate("/user", { replace: true });
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to login. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        {/* Left panel */}
        <section className="auth-brand-panel">
          <div className="auth-brand-content">
            <div className="auth-brand-logo">
              <Store size={22} strokeWidth={2.2} />
            </div>

            <div className="auth-brand-name">
              <strong>RatePoint</strong>
              <span>Store Rating Platform</span>
            </div>

            <div className="auth-hero-copy">
              <span className="auth-eyebrow">
                <Star size={14} fill="currentColor" />
                Trusted store discovery
              </span>

              <h2>
                Discover stores.
                <br />
                Share your experience.
              </h2>

              <p>
                A simple platform to discover stores, compare ratings,
                and share your experience with the community.
              </p>
            </div>

            <div className="auth-feature-list">
              <div className="auth-feature">
                <div className="auth-feature-icon">
                  <Star size={17} />
                </div>
                <div>
                  <strong>Rate with confidence</strong>
                  <span>Share ratings from 1 to 5 stars.</span>
                </div>
              </div>

              <div className="auth-feature">
                <div className="auth-feature-icon">
                  <ShieldCheck size={17} />
                </div>
                <div>
                  <strong>Secure accounts</strong>
                  <span>Your account is protected with authentication.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="auth-brand-footer">
            Store Rating Platform
          </div>
        </section>

        {/* Form panel */}
        <section className="auth-form-panel">
          <div className="auth-form-wrapper">
            <div className="auth-mobile-brand">
              <div className="auth-brand-logo">
                <Store size={20} />
              </div>
              <strong>RatePoint</strong>
            </div>

            <div className="auth-heading">
              <span className="auth-form-eyebrow">Welcome back</span>

              <h1>Sign in to your account</h1>

              <p>
                Enter your credentials to continue to your dashboard.
              </p>
            </div>

            {error && (
              <div className="auth-alert auth-alert-error" role="alert">
                <span className="auth-alert-dot" />
                <span>{error}</span>
              </div>
            )}

            <form
              className="auth-form"
              onSubmit={handleSubmit}
            >
              <div className="auth-field">
                <label htmlFor="login-email">Email address</label>

                <div className="auth-input-wrapper">
                  <Mail size={18} />

                  <input
                    id="login-email"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="auth-field">
                <div className="auth-label-row">
                  <label htmlFor="login-password">
                    Password
                  </label>
                </div>

                <div className="auth-input-wrapper">
                  <LockKeyhole size={18} />

                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                  />

                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() =>
                      setShowPassword((prev) => !prev)
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="auth-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="auth-spinner" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>

            <div className="auth-divider">
              <span>New to RatePoint?</span>
            </div>

            <button
              type="button"
              className="auth-secondary-btn"
              onClick={() => navigate("/register")}
            >
              Create an account
            </button>

            <p className="auth-legal">
              By continuing, you agree to use the platform responsibly
              and provide accurate information.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Login;