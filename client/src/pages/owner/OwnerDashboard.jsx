import {
  Activity,
  ChevronDown,
  KeyRound,
  LogOut,
  MapPin,
  RefreshCw,
  Star,
  Store,
  X,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";


const INITIAL_RATINGS = 8;

const EMPTY_PASSWORD_FORM = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};


/* =========================================================
   Helpers
========================================================= */

const formatDate = (value) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};


const getFirstName = (name) => {
  return name?.trim()?.split(/\s+/)[0] || "there";
};


const getInitial = (name) => {
  return (
    name
      ?.trim()
      ?.charAt(0)
      ?.toUpperCase() || "?"
  );
};


const getPerformanceLabel = (rating) => {
  if (rating >= 4.5) {
    return "Excellent performance";
  }

  if (rating >= 4) {
    return "Very good performance";
  }

  if (rating >= 3) {
    return "Good performance";
  }

  return "Needs improvement";
};


/* =========================================================
   Stars
========================================================= */

const Stars = ({ value, small = false }) => {
  const roundedValue = Math.round(
    Number(value) || 0
  );

  return (
    <span
      className={
        small
          ? "ui-stars ui-stars-sm"
          : "ui-stars"
      }
      role="img"
      aria-label={`${value} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={
            star <= roundedValue
              ? "ui-star-on"
              : ""
          }
        >
          ★
        </span>
      ))}
    </span>
  );
};


/* =========================================================
   Change Password Modal
========================================================= */

const ChangePasswordModal = ({
  open,
  form,
  loading,
  error,
  success,
  onChange,
  onSubmit,
  onClose,
}) => {
  if (!open) {
    return null;
  }

  return (
    <div
      className="ui-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !loading
        ) {
          onClose();
        }
      }}
    >
      <div
        className="ui-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-password-title"
      >
        {/* HEADER */}

        <div className="ui-modal-header">
          <div>
            <span className="ui-modal-icon">
              <KeyRound size={20} />
            </span>

            <div>
              <h2 id="change-password-title">
                Change password
              </h2>

              <p>
                Update your account password.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="ui-modal-close"
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
          >
            <X size={19} />
          </button>
        </div>


        {/* FORM */}

        <form
          className="ui-modal-form"
          onSubmit={onSubmit}
        >
          {/* ERROR */}

          {error && (
            <div
              className="ui-message ui-message-error"
              role="alert"
            >
              {error}
            </div>
          )}


          {/* SUCCESS */}

          {success && (
            <div
              className="ui-message ui-message-success"
              role="status"
            >
              {success}
            </div>
          )}


          {/* CURRENT PASSWORD */}

          <div className="ui-form-group">
            <label htmlFor="currentPassword">
              Current password
            </label>

            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              className="ui-input"
              value={form.currentPassword}
              onChange={onChange}
              autoComplete="current-password"
              required
              disabled={loading}
            />
          </div>


          {/* NEW PASSWORD */}

          <div className="ui-form-group">
            <label htmlFor="newPassword">
              New password
            </label>

            <input
              id="newPassword"
              name="newPassword"
              type="password"
              className="ui-input"
              value={form.newPassword}
              onChange={onChange}
              autoComplete="new-password"
              minLength={8}
              maxLength={16}
              required
              disabled={loading}
            />

            <small>
              8–16 characters, including at least
              one uppercase letter and one special
              character.
            </small>
          </div>


          {/* CONFIRM PASSWORD */}

          <div className="ui-form-group">
            <label htmlFor="confirmPassword">
              Confirm new password
            </label>

            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              className="ui-input"
              value={form.confirmPassword}
              onChange={onChange}
              autoComplete="new-password"
              minLength={8}
              maxLength={16}
              required
              disabled={loading}
            />
          </div>


          {/* ACTIONS */}

          <div className="ui-modal-actions">
            <button
              type="button"
              className="ui-btn"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="ui-btn ui-btn-primary"
              disabled={loading}
            >
              {loading
                ? "Updating..."
                : "Change password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


/* =========================================================
   Owner Dashboard
========================================================= */

const OwnerDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  /* =========================================================
     Dashboard State
  ========================================================= */

  const [dashboard, setDashboard] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [storeFilter, setStoreFilter] =
    useState("all");

  const [showAll, setShowAll] =
    useState(false);


  /* =========================================================
     User Menu
  ========================================================= */

  const [showUserMenu, setShowUserMenu] =
    useState(false);

  const userMenuRef = useRef(null);


  /* =========================================================
     Change Password State
  ========================================================= */

  const [showPasswordModal, setShowPasswordModal] =
    useState(false);

  const [passwordForm, setPasswordForm] =
    useState(EMPTY_PASSWORD_FORM);

  const [passwordLoading, setPasswordLoading] =
    useState(false);

  const [passwordError, setPasswordError] =
    useState("");

  const [passwordSuccess, setPasswordSuccess] =
    useState("");


  /* =========================================================
     Close User Menu On Outside Click / Escape
  ========================================================= */

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(
          event.target
        )
      ) {
        setShowUserMenu(false);
      }
    };


    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowUserMenu(false);
      }
    };


    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    document.addEventListener(
      "keydown",
      handleEscape
    );


    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );

      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);


  /* =========================================================
     Fetch Dashboard
  ========================================================= */

  const fetchDashboard = useCallback(
    async (signal) => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          "/owner/dashboard",
          signal
            ? { signal }
            : undefined
        );

        setDashboard(
          response.data?.data ?? null
        );
      } catch (err) {
        if (
          err.name === "CanceledError" ||
          err.code === "ERR_CANCELED"
        ) {
          return;
        }

        console.error(
          "OWNER DASHBOARD ERROR:",
          err
        );

        setError(
          err.response?.data?.message ||
            "Unable to load owner dashboard."
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    []
  );


  /* =========================================================
     Initial Dashboard Request
  ========================================================= */

  useEffect(() => {
    const controller =
      new AbortController();

    fetchDashboard(
      controller.signal
    );

    return () => {
      controller.abort();
    };
  }, [fetchDashboard]);


  /* =========================================================
     Logout
  ========================================================= */

  const handleLogout = useCallback(() => {
    setShowUserMenu(false);

    logout();

    navigate("/login");
  }, [logout, navigate]);


  /* =========================================================
     Open Change Password
  ========================================================= */

  const openPasswordModal = useCallback(() => {
    setShowUserMenu(false);

    setPasswordForm(
      EMPTY_PASSWORD_FORM
    );

    setPasswordError("");
    setPasswordSuccess("");

    setShowPasswordModal(true);
  }, []);


  /* =========================================================
     Close Change Password
  ========================================================= */

  const closePasswordModal = useCallback(() => {
    if (passwordLoading) {
      return;
    }

    setShowPasswordModal(false);

    setPasswordForm(
      EMPTY_PASSWORD_FORM
    );

    setPasswordError("");
    setPasswordSuccess("");
  }, [passwordLoading]);


  /* =========================================================
     Password Input Change
  ========================================================= */

  const handlePasswordChange = useCallback(
    (event) => {
      const {
        name,
        value,
      } = event.target;

      setPasswordForm(
        (previous) => ({
          ...previous,
          [name]: value,
        })
      );

      setPasswordError("");
      setPasswordSuccess("");
    },
    []
  );


  /* =========================================================
     Change Password API
  ========================================================= */

  const handleChangePassword =
    useCallback(
      async (event) => {
        event.preventDefault();

        if (passwordLoading) {
          return;
        }

        const {
          currentPassword,
          newPassword,
          confirmPassword,
        } = passwordForm;


        /* ---------------------------------------------
           Validation
        --------------------------------------------- */

        if (!currentPassword.trim()) {
          setPasswordError(
            "Current password is required."
          );

          return;
        }


        const passwordRegex =
          /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,16}$/;


        if (
          !passwordRegex.test(
            newPassword
          )
        ) {
          setPasswordError(
            "New password must be 8–16 characters and include at least one uppercase letter and one special character."
          );

          return;
        }


        if (
          newPassword !==
          confirmPassword
        ) {
          setPasswordError(
            "New password and confirm password do not match."
          );

          return;
        }


        if (
          currentPassword ===
          newPassword
        ) {
          setPasswordError(
            "New password must be different from your current password."
          );

          return;
        }


        /* ---------------------------------------------
           API Request
        --------------------------------------------- */

        try {
          setPasswordLoading(true);
          setPasswordError("");
          setPasswordSuccess("");


          const response =
            await api.put(
              "/auth/change-password",
              {
                currentPassword,
                newPassword,
              }
            );


          setPasswordSuccess(
            response.data?.message ||
              "Password changed successfully."
          );


          setPasswordForm(
            EMPTY_PASSWORD_FORM
          );
        } catch (err) {
          console.error(
            "CHANGE PASSWORD ERROR:",
            err
          );

          setPasswordError(
            err.response?.data?.message ||
              "Unable to change password."
          );
        } finally {
          setPasswordLoading(false);
        }
      },
      [
        passwordForm,
        passwordLoading,
      ]
    );


  /* =========================================================
     Stores
  ========================================================= */

  const stores = useMemo(
    () =>
      dashboard?.stores ?? [],
    [dashboard?.stores]
  );


  /* =========================================================
     All Ratings
  ========================================================= */

  const allRatings = useMemo(() => {
    return stores
      .flatMap((store) =>
        (store.raters ?? []).map(
          (rater) => ({
            ...rater,
            storeId: store.id,
            storeName: store.name,
          })
        )
      )
      .sort(
        (a, b) =>
          new Date(
            b.submittedAt || 0
          ) -
          new Date(
            a.submittedAt || 0
          )
      );
  }, [stores]);


  /* =========================================================
     Filtered Ratings
  ========================================================= */

  const visibleRatings = useMemo(() => {
    if (storeFilter === "all") {
      return allRatings;
    }

    return allRatings.filter(
      (rating) =>
        String(rating.storeId) ===
        storeFilter
    );
  }, [
    allRatings,
    storeFilter,
  ]);


  /* =========================================================
     Visible Ratings
  ========================================================= */

  const shownRatings = useMemo(
    () =>
      showAll
        ? visibleRatings
        : visibleRatings.slice(
            0,
            INITIAL_RATINGS
          ),
    [
      visibleRatings,
      showAll,
    ]
  );


  /* =========================================================
     Dashboard Stats
  ========================================================= */

  const overall = Number(
    dashboard?.overallAverage || 0
  );

  const totalRatings = Number(
    dashboard?.totalRatings || 0
  );

  const totalStores = Number(
    dashboard?.totalStores ??
      stores.length
  );


  const firstName = useMemo(
    () =>
      getFirstName(user?.name),
    [user?.name]
  );


  const ratingLabel = useMemo(
    () =>
      getPerformanceLabel(
        overall
      ),
    [overall]
  );


  /* =========================================================
     KPI Cards
  ========================================================= */

  const statCards = useMemo(
    () => [
      {
        key: "stores",
        label: "My stores",
        value: totalStores,
        note: "Stores assigned to you",
        icon: Store,
      },
      {
        key: "ratings",
        label: "Total ratings",
        value: totalRatings,
        note: "Customer ratings received",
        icon: Star,
      },
      {
        key: "average",
        label: "Overall rating",
        value: overall.toFixed(1),
        note: ratingLabel,
        icon: Activity,
      },
    ],
    [
      totalStores,
      totalRatings,
      overall,
      ratingLabel,
    ]
  );


  /* =========================================================
     Render
  ========================================================= */

  return (
    <div className="ui-shell owner-dashboard">

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <header className="ui-nav">
        <div className="ui-nav-inner">

          {/* BRAND */}

          <div className="ui-brand">
            <div className="ui-brand-icon">
              ★
            </div>

            <div>
              <strong>
                RatePoint
              </strong>

              <span>
                Owner portal
              </span>
            </div>
          </div>


          {/* USER AREA */}

          <div
            className="ui-nav-right"
            ref={userMenuRef}
          >

            <button
              type="button"
              className="ui-nav-user"
              onClick={() =>
                setShowUserMenu(
                  (previous) =>
                    !previous
                )
              }
              aria-expanded={
                showUserMenu
              }
              aria-haspopup="menu"
            >

              <div className="ui-avatar ui-avatar-owner">
                {getInitial(
                  user?.name
                )}
              </div>


              <div className="ui-nav-text">
                <strong
                  title={
                    user?.name ||
                    "Store Owner"
                  }
                >
                  {user?.name ||
                    "Store Owner"}
                </strong>

                <span>
                  Store owner
                </span>
              </div>


              <ChevronDown
                size={17}
                className={
                  showUserMenu
                    ? "ui-user-menu-chevron ui-user-menu-chevron-open"
                    : "ui-user-menu-chevron"
                }
              />

            </button>


            {/* USER DROPDOWN */}

            {showUserMenu && (
              <div
                className="ui-user-menu"
                role="menu"
              >

                {/* USER INFO */}

                <div className="ui-user-menu-header">

                  <div className="ui-avatar ui-avatar-owner">
                    {getInitial(
                      user?.name
                    )}
                  </div>


                  <div>
                    <strong
                      title={
                        user?.name ||
                        "Store Owner"
                      }
                    >
                      {user?.name ||
                        "Store Owner"}
                    </strong>

                    <span
                      title={
                        user?.email || ""
                      }
                    >
                      {user?.email ||
                        "Store owner"}
                    </span>
                  </div>

                </div>


                <div className="ui-user-menu-divider" />


                {/* CHANGE PASSWORD */}

                <button
                  type="button"
                  className="ui-user-menu-item"
                  role="menuitem"
                  onClick={
                    openPasswordModal
                  }
                >
                  <KeyRound
                    size={17}
                  />

                  <span>
                    Change password
                  </span>
                </button>


                {/* LOGOUT */}

                <button
                  type="button"
                  className="ui-user-menu-item ui-user-menu-danger"
                  role="menuitem"
                  onClick={
                    handleLogout
                  }
                >
                  <LogOut
                    size={17}
                  />

                  <span>
                    Log out
                  </span>
                </button>

              </div>
            )}

          </div>

        </div>
      </header>


      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="ui-main">

        {/* ===================================================
            HERO
        =================================================== */}

        <section className="owner-hero">

          <div>

            <div className="owner-eyebrow">
              OWNER OVERVIEW
            </div>


            <h1>
              Welcome back,{" "}
              {firstName} 👋
            </h1>


            <p>
              Keep track of your stores,
              ratings and customer feedback.
            </p>

          </div>


          <button
            type="button"
            className="ui-btn ui-btn-primary"
            onClick={() =>
              fetchDashboard()
            }
            disabled={loading}
          >

            <RefreshCw
              size={17}
              className={
                loading
                  ? "ad-spin"
                  : ""
              }
            />

            {loading
              ? "Refreshing..."
              : "Refresh data"}

          </button>

        </section>


        {/* ===================================================
            ERROR
        =================================================== */}

        {error && (
          <div
            className="ui-message ui-message-error"
            role="alert"
          >

            <span>
              {error}
            </span>


            <button
              type="button"
              onClick={() =>
                setError("")
              }
              aria-label="Dismiss error"
            >
              <X size={16} />
            </button>

          </div>
        )}


        {/* ===================================================
            LOADING
        =================================================== */}

        {loading && !dashboard ? (
          <div className="ui-state">

            <div className="ui-spinner" />

            <h2>
              Loading your dashboard
            </h2>

            <p>
              Fetching your store
              performance...
            </p>

          </div>
        ) : (
          <>

            {/* =================================================
                KPI CARDS
            ================================================= */}

            <section className="owner-kpi-grid">

              {statCards.map(
                (card) => {
                  const Icon =
                    card.icon;

                  return (
                    <article
                      key={
                        card.key
                      }
                      className={`owner-kpi owner-kpi-${card.key}`}
                    >

                      <div className="owner-kpi-top">

                        <div className="owner-kpi-icon">
                          <Icon
                            size={21}
                          />
                        </div>

                        <span>
                          {card.label}
                        </span>

                      </div>


                      <strong className="owner-kpi-value">
                        {card.value}
                      </strong>


                      <span className="owner-kpi-note">
                        {card.note}
                      </span>

                    </article>
                  );
                }
              )}

            </section>


            {/* =================================================
                STORES
            ================================================= */}

            <section className="owner-section">

              <div className="owner-section-header">

                <div>

                  <span className="owner-section-label">
                    BUSINESS PERFORMANCE
                  </span>


                  <h2>
                    Your stores
                  </h2>


                  <p>
                    Monitor ratings and
                    customer activity for
                    each store.
                  </p>

                </div>


                <span className="ui-badge-soft">
                  {stores.length}{" "}
                  {stores.length === 1
                    ? "store"
                    : "stores"}
                </span>

              </div>


              {stores.length === 0 ? (
                <div className="ui-card">

                  <div className="ui-empty">

                    <div className="ui-empty-icon">
                      <Store
                        size={24}
                      />
                    </div>


                    <h3>
                      No stores assigned yet
                    </h3>


                    <p>
                      Ask an administrator
                      to assign a store to
                      your account.
                    </p>

                  </div>

                </div>
              ) : (
                <div className="owner-store-grid">

                  {stores.map(
                    (store) => {

                      const average =
                        Number(
                          store.averageRating ||
                            0
                        );


                      const ratingCount =
                        Number(
                          store.totalRatings ||
                            0
                        );


                      const raters =
                        store.raters ??
                        [];


                      /* ---------------------------------------
                         Rating distribution
                      --------------------------------------- */

                      const distribution = {
                        5: 0,
                        4: 0,
                        3: 0,
                        2: 0,
                        1: 0,
                      };


                      raters.forEach(
                        (rater) => {
                          const rating =
                            Number(
                              rater.rating
                            );

                          if (
                            Object.prototype.hasOwnProperty.call(
                              distribution,
                              rating
                            )
                          ) {
                            distribution[
                              rating
                            ] += 1;
                          }
                        }
                      );


                      return (
                        <article
                          className="owner-store-card"
                          key={
                            store.id
                          }
                        >

                          {/* STORE HEADER */}

                          <div className="owner-store-header">

                            <div className="owner-store-identity">

                              <div className="owner-store-icon">
                                {getInitial(
                                  store.name
                                )}
                              </div>


                              <div>

                                <h3
                                  title={
                                    store.name
                                  }
                                >
                                  {store.name}
                                </h3>


                                <p
                                  title={
                                    store.email ||
                                    ""
                                  }
                                >
                                  {store.email ||
                                    "No email available"}
                                </p>

                              </div>

                            </div>


                            <div className="owner-rating-badge">

                              <strong>
                                {average.toFixed(
                                  1
                                )}
                              </strong>


                              <Stars
                                value={
                                  average
                                }
                                small
                              />

                            </div>

                          </div>


                          {/* ADDRESS */}

                          <div className="owner-store-location">

                            <span className="owner-location-icon">
                              <MapPin
                                size={16}
                              />
                            </span>


                            <span
                              title={
                                store.address ||
                                ""
                              }
                            >
                              {store.address ||
                                "No address available"}
                            </span>

                          </div>


                          {/* RATING DISTRIBUTION */}

                          <div className="owner-store-performance">

                            <div className="owner-performance-title">

                              <strong>
                                Rating
                                distribution
                              </strong>


                              <span>
                                {ratingCount}{" "}
                                {ratingCount ===
                                1
                                  ? "rating"
                                  : "ratings"}
                              </span>

                            </div>


                            <div className="owner-rating-bars">

                              {[5, 4, 3, 2, 1].map(
                                (star) => {

                                  const count =
                                    distribution[
                                      star
                                    ];


                                  const percentage =
                                    raters.length >
                                    0
                                      ? (count /
                                          raters.length) *
                                        100
                                      : 0;


                                  return (
                                    <div
                                      className="owner-rating-bar"
                                      key={
                                        star
                                      }
                                    >

                                      <span>
                                        {star} ★
                                      </span>


                                      <div className="owner-bar-track">

                                        <div
                                          className="owner-bar-fill"
                                          style={{
                                            width: `${percentage}%`,
                                          }}
                                        />

                                      </div>


                                      <span>
                                        {count}
                                      </span>

                                    </div>
                                  );
                                }
                              )}

                            </div>

                          </div>


                          {/* FOOTER */}

                          <div className="owner-store-footer">

                            <div>

                              <span>
                                Average rating
                              </span>


                              <strong>
                                ★{" "}
                                {average.toFixed(
                                  1
                                )}
                              </strong>

                            </div>


                            <div>

                              <span>
                                Total ratings
                              </span>


                              <strong>
                                {ratingCount}
                              </strong>

                            </div>

                          </div>

                        </article>
                      );
                    }
                  )}

                </div>
              )}

            </section>


            {/* =================================================
                RECENT RATINGS
            ================================================= */}

            <section className="owner-section">

              <div className="owner-section-header">

                <div>

                  <span className="owner-section-label">
                    CUSTOMER ACTIVITY
                  </span>


                  <h2>
                    Recent ratings
                  </h2>


                  <p>
                    See who rated your stores
                    and their submitted scores.
                  </p>

                </div>


                {stores.length > 1 && (
                  <select
                    className="ui-input ui-select-sm"
                    value={
                      storeFilter
                    }
                    onChange={(
                      event
                    ) => {
                      setStoreFilter(
                        event.target
                          .value
                      );

                      setShowAll(
                        false
                      );
                    }}
                  >

                    <option value="all">
                      All stores
                    </option>


                    {stores.map(
                      (store) => (
                        <option
                          key={
                            store.id
                          }
                          value={String(
                            store.id
                          )}
                        >
                          {store.name}
                        </option>
                      )
                    )}

                  </select>
                )}

              </div>


              <div className="owner-ratings-card">

                {visibleRatings.length ===
                0 ? (
                  <div className="ui-empty">

                    <div className="ui-empty-icon">
                      <Star
                        size={24}
                      />
                    </div>


                    <h3>
                      No ratings yet
                    </h3>


                    <p>
                      Customer ratings will
                      appear here once your
                      stores receive them.
                    </p>

                  </div>
                ) : (
                  <>

                    <div className="owner-ratings-head">

                      <span>
                        Customer
                      </span>

                      <span>
                        Store
                      </span>

                      <span>
                        Rating
                      </span>

                      <span>
                        Date
                      </span>

                    </div>


                    {shownRatings.map(
                      (
                        rater,
                        index
                      ) => (
                        <div
                          className="owner-rating-row"
                          key={`${rater.storeId}-${rater.userId}-${rater.submittedAt}-${index}`}
                        >

                          <div className="owner-rating-person">

                            <div className="ui-avatar">
                              {getInitial(
                                rater.name
                              )}
                            </div>


                            <div>

                              <strong
                                title={
                                  rater.name ||
                                  "Anonymous"
                                }
                              >
                                {rater.name ||
                                  "Anonymous"}
                              </strong>


                              <span
                                title={
                                  rater.email ||
                                  ""
                                }
                              >
                                {rater.email ||
                                  "No email"}
                              </span>

                            </div>

                          </div>


                          <div
                            className="owner-rating-store"
                            title={
                              rater.storeName
                            }
                          >
                            {rater.storeName}
                          </div>


                          <div className="owner-rating-score">

                            <Stars
                              value={Number(
                                rater.rating
                              )}
                              small
                            />


                            <strong>
                              {rater.rating}/5
                            </strong>

                          </div>


                          <div className="owner-rating-date">

                            {formatDate(
                              rater.submittedAt
                            ) || "—"}

                          </div>

                        </div>
                      )
                    )}


                    {visibleRatings.length >
                      INITIAL_RATINGS && (
                      <button
                        type="button"
                        className="owner-show-more"
                        onClick={() =>
                          setShowAll(
                            (previous) =>
                              !previous
                          )
                        }
                      >
                        {showAll
                          ? "Show less"
                          : `Show all ${visibleRatings.length} ratings`}
                      </button>
                    )}

                  </>
                )}

              </div>

            </section>

          </>
        )}

      </main>


      {/* =====================================================
          CHANGE PASSWORD MODAL
      ===================================================== */}

      <ChangePasswordModal
        open={
          showPasswordModal
        }
        form={
          passwordForm
        }
        loading={
          passwordLoading
        }
        error={
          passwordError
        }
        success={
          passwordSuccess
        }
        onChange={
          handlePasswordChange
        }
        onSubmit={
          handleChangePassword
        }
        onClose={
          closePasswordModal
        }
      />

    </div>
  );
};


export default OwnerDashboard;

