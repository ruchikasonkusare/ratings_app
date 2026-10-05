import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  MapPin,
  ShieldCheck,
  Star,
  Store,
  UserRound,
} from "lucide-react";

import api from "../services/api";

const Register = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    address: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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

    if (success) {
      setSuccess("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const name = form.name.trim();
    const email = form.email.trim();
    const address = form.address.trim();

    if (name.length < 20 || name.length > 60) {
      setError("Name must be between 20 and 60 characters.");
      return;
    }

    if (address.length === 0 || address.length > 400) {
      setError("Address is required and must not exceed 400 characters.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    const passwordRegex =
      /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,16}$/;

    if (!passwordRegex.test(form.password)) {
      setError(
        "Password must be 8–16 characters and include an uppercase letter and a special character."
      );
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/register", {
        name,
        email,
        password: form.password,
        address,
      });

      setSuccess(
        "Account created successfully. Redirecting you to login..."
      );

      setForm({
        name: "",
        email: "",
        password: "",
        address: "",
      });

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1200);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to create your account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const password = form.password;

  const passwordRules = [
    {
      label: "8–16 characters",
      valid: password.length >= 8 && password.length <= 16,
    },
    {
      label: "One uppercase letter",
      valid: /[A-Z]/.test(password),
    },
    {
      label: "One special character",
      valid: /[^A-Za-z0-9]/.test(password),
    },
  ];

  return (
    <div className="auth-page">
      <div className="auth-shell auth-register-shell">
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
                Join the community
              </span>

              <h2>
                Your opinion
                <br />
                helps others.
              </h2>

              <p>
                Create your account and start discovering stores,
                reviewing experiences, and making better decisions.
              </p>
            </div>

            <div className="auth-register-benefits">
              <div className="auth-benefit">
                <div className="auth-benefit-check">
                  <Check size={14} />
                </div>
                <span>Discover registered stores</span>
              </div>

              <div className="auth-benefit">
                <div className="auth-benefit-check">
                  <Check size={14} />
                </div>
                <span>Submit and update ratings</span>
              </div>

              <div className="auth-benefit">
                <div className="auth-benefit-check">
                  <Check size={14} />
                </div>
                <span>Manage your account securely</span>
              </div>
            </div>
          </div>

          <div className="auth-brand-footer">
            Store Rating Platform
          </div>
        </section>

        {/* Form panel */}
        <section className="auth-form-panel">
          <div className="auth-form-wrapper auth-register-wrapper">
            <div className="auth-mobile-brand">
              <div className="auth-brand-logo">
                <Store size={20} />
              </div>
              <strong>RatePoint</strong>
            </div>

            <button
              type="button"
              className="auth-back-btn"
              onClick={() => navigate("/login")}
            >
              <ArrowLeft size={16} />
              Back to login
            </button>

            <div className="auth-heading">
              <span className="auth-form-eyebrow">
                Get started
              </span>

              <h1>Create your account</h1>

              <p>
                Fill in your details to create a normal user account.
              </p>
            </div>

            {error && (
              <div className="auth-alert auth-alert-error" role="alert">
                <span className="auth-alert-dot" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div
                className="auth-alert auth-alert-success"
                role="status"
              >
                <Check size={17} />
                <span>{success}</span>
              </div>
            )}

            <form
              className="auth-form"
              onSubmit={handleSubmit}
            >
              <div className="auth-field">
                <label htmlFor="register-name">
                  Full name
                </label>

                <div className="auth-input-wrapper">
                  <UserRound size={18} />

                  <input
                    id="register-name"
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    minLength={20}
                    maxLength={60}
                    autoComplete="name"
                    required
                  />
                </div>

                <div className="auth-field-hint">
                  <span>
                    Use between 20 and 60 characters.
                  </span>
                  <span>{form.name.length}/60</span>
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="register-email">
                  Email address
                </label>

                <div className="auth-input-wrapper">
                  <Mail size={18} />

                  <input
                    id="register-email"
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
                <label htmlFor="register-password">
                  Password
                </label>

                <div className="auth-input-wrapper">
                  <LockKeyhole size={18} />

                  <input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Create a strong password"
                    autoComplete="new-password"
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

                <div className="auth-password-rules">
                  {passwordRules.map((rule) => (
                    <span
                      key={rule.label}
                      className={
                        rule.valid
                          ? "auth-rule auth-rule-valid"
                          : "auth-rule"
                      }
                    >
                      <span className="auth-rule-icon">
                        <Check size={11} />
                      </span>
                      {rule.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="register-address">
                  Address
                </label>

                <div className="auth-input-wrapper auth-textarea-wrapper">
                  

                  <textarea
                    id="register-address"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Enter your complete address"
                    rows={3}
                    maxLength={400}
                    required
                  />
                </div>

                <div className="auth-field-hint">
                  <span>Maximum 400 characters.</span>
                  <span>{form.address.length}/400</span>
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
                    Creating account...
                  </>
                ) : (
                  <>
                    Create account
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>

            <div className="auth-secure-note">
              <ShieldCheck size={16} />
              <span>
                Your password is securely protected.
              </span>
            </div>

            <p className="auth-switch-text">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
              >
                Sign in
              </button>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Register;