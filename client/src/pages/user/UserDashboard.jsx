import {
  ChevronDown,
  ChevronUp,
  MapPin,
  Search,
  Star,
  Store,
  X,
  LogOut,
  UserRound,
  ArrowRight,
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

const sortOptions = [
  {
    field: "name",
    label: "Name",
  },
  {
    field: "averageRating",
    label: "Rating",
  },
  {
    field: "address",
    label: "Address",
  },
];

const ratingLabels = [
  "",
  "Poor",
  "Fair",
  "Good",
  "Very good",
  "Excellent",
];


/* =========================================================
   Stars
========================================================= */

const Stars = ({
  value,
  small = false,
}) => {
  const rating = Number(value) || 0;

  return (
    <span
      className={
        small
          ? "ui-stars ui-stars-sm"
          : "ui-stars"
      }
      role="img"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={
            star <= Math.round(rating)
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
   User Dashboard
========================================================= */

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const profileRef = useRef(null);

  /* =========================================================
     State
  ========================================================= */

  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [sortBy, setSortBy] = useState("name");
  const [order, setOrder] = useState("asc");

  const [selectedStore, setSelectedStore] =
    useState(null);

  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] =
    useState(false);

  const [modalError, setModalError] =
    useState("");

  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  const [profileOpen, setProfileOpen] =
    useState(false);


  /* =========================================================
     User Info
  ========================================================= */

  const userName =
    user?.name?.trim() || "Customer";

  const userEmail =
    user?.email || "No email available";

  const firstName =
    userName.split(/\s+/)[0] || "there";

  const userInitial =
    userName.charAt(0).toUpperCase() || "?";


  /* =========================================================
     Search Debounce
  ========================================================= */

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [searchInput]);


  /* =========================================================
     Fetch Stores
  ========================================================= */

  const fetchStores = useCallback(
    async (signal) => {
      try {
        setLoading(true);

        const response = await api.get(
          "/user/stores",
          {
            params: {
              search,
              sortBy,
              order,
            },
            signal,
          }
        );

        const data =
          response.data?.data ??
          response.data;

        const storeList = Array.isArray(data)
          ? data
          : data?.stores || [];

        setStores(storeList);
      } catch (error) {
        if (
          error.name === "CanceledError" ||
          error.code === "ERR_CANCELED"
        ) {
          return;
        }

        console.error(
          "FETCH STORES ERROR:",
          error
        );

        setStores([]);

        setMessage({
          type: "error",
          text:
            error.response?.data?.message ||
            "Failed to load stores.",
        });
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [search, sortBy, order]
  );


  /* =========================================================
     Fetch On Search / Sort
  ========================================================= */

  useEffect(() => {
    const controller =
      new AbortController();

    fetchStores(controller.signal);

    return () => {
      controller.abort();
    };
  }, [fetchStores]);


  /* =========================================================
     Close Profile Menu On Outside Click
  ========================================================= */

  useEffect(() => {
    if (!profileOpen) return;

    const handleOutsideClick = (event) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(
          event.target
        )
      ) {
        setProfileOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, [profileOpen]);


  /* =========================================================
     Keyboard Handling
  ========================================================= */

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== "Escape") {
        return;
      }

      if (profileOpen) {
        setProfileOpen(false);
      }

      if (selectedStore && !submitting) {
        setSelectedStore(null);
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    profileOpen,
    selectedStore,
    submitting,
  ]);


  /* =========================================================
     Logout
  ========================================================= */

  const handleLogout = useCallback(() => {
    setProfileOpen(false);

    logout();
    navigate("/login");
  }, [logout, navigate]);


  /* =========================================================
     Sort
  ========================================================= */

  const handleSort = useCallback(
    (field) => {
      if (sortBy === field) {
        setOrder((previous) =>
          previous === "asc"
            ? "desc"
            : "asc"
        );
      } else {
        setSortBy(field);
        setOrder("asc");
      }
    },
    [sortBy]
  );


  /* =========================================================
     Open Rating Modal
  ========================================================= */

  const openRating = useCallback(
    (store) => {
      setSelectedStore(store);

      setRating(
        Number(store.userRating) || 0
      );

      setModalError("");
    },
    []
  );


  /* =========================================================
     Close Rating Modal
  ========================================================= */

  const closeRating = useCallback(() => {
    if (submitting) return;

    setSelectedStore(null);
    setRating(0);
    setModalError("");
  }, [submitting]);


  /* =========================================================
     Submit Rating
  ========================================================= */

  const submitRating = useCallback(
    async () => {
      if (!selectedStore) {
        return;
      }

      if (!rating) {
        setModalError(
          "Please select a rating from 1 to 5."
        );
        return;
      }

      try {
        setSubmitting(true);
        setModalError("");

        await api.post(
          `/user/stores/${selectedStore.id}/rating`,
          {
            rating,
          }
        );

        setMessage({
          type: "success",
          text: `Your rating for ${selectedStore.name} was saved.`,
        });

        setSelectedStore(null);
        setRating(0);

        /*
         * Refresh exactly once after
         * successful rating submission.
         */
        await fetchStores();
      } catch (error) {
        console.error(
          "SUBMIT RATING ERROR:",
          error
        );

        setModalError(
          error.response?.data?.message ||
            "Failed to submit rating."
        );
      } finally {
        setSubmitting(false);
      }
    },
    [
      selectedStore,
      rating,
      fetchStores,
    ]
  );


  /* =========================================================
     Clear Filters
  ========================================================= */

  const clearFilters = useCallback(() => {
    setSearchInput("");
    setSearch("");
    setSortBy("name");
    setOrder("asc");
  }, []);


  /* =========================================================
     Derived Statistics
  ========================================================= */

  const ratedCount = useMemo(() => {
    return stores.filter(
      (store) =>
        Number(store.userRating) > 0
    ).length;
  }, [stores]);


  const averagePlatformRating =
    useMemo(() => {
      if (!stores.length) {
        return 0;
      }

      const total = stores.reduce(
        (sum, store) =>
          sum +
          Number(
            store.averageRating || 0
          ),
        0
      );

      return total / stores.length;
    }, [stores]);


  const isFiltered =
    Boolean(searchInput.trim()) ||
    sortBy !== "name" ||
    order !== "asc";


  /* =========================================================
     Render
  ========================================================= */

  return (
    <div className="ui-shell">

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
                Discover & rate stores
              </span>
            </div>

          </div>


          {/* RIGHT SIDE */}

          <div className="ui-nav-right">

            {/* PROFILE */}

            <div
              className="user-profile-wrapper"
              ref={profileRef}
            >

              <button
                type="button"
                className={`user-profile-trigger ${
                  profileOpen
                    ? "user-profile-trigger-active"
                    : ""
                }`}
                onClick={() =>
                  setProfileOpen(
                    (previous) =>
                      !previous
                  )
                }
                aria-expanded={
                  profileOpen
                }
                aria-haspopup="menu"
              >

                <div className="ui-avatar">
                  {userInitial}
                </div>

                <div className="ui-nav-text">

                  <strong
                    title={userName}
                  >
                    {userName}
                  </strong>

                  <span>
                    Customer
                  </span>

                </div>

                {profileOpen ? (
                  <ChevronUp
                    size={16}
                  />
                ) : (
                  <ChevronDown
                    size={16}
                  />
                )}

              </button>


              {/* PROFILE DROPDOWN */}

              {profileOpen && (
                <div
                  className="user-profile-menu"
                  role="menu"
                >

                  {/* PROFILE INFO */}

                  <div className="user-profile-info">

                    <div className="user-profile-avatar">
                      {userInitial}
                    </div>

                    <div className="user-profile-details">

                      <strong
                        title={userName}
                      >
                        {userName}
                      </strong>

                      <span
                        title={userEmail}
                      >
                        {userEmail}
                      </span>

                      <small>
                        Customer
                      </small>

                    </div>

                  </div>


                  <div className="user-profile-divider" />


                  {/* LOGOUT */}

                  <button
                    type="button"
                    className="user-profile-menu-item user-profile-logout"
                    onClick={
                      handleLogout
                    }
                    role="menuitem"
                  >
                    <span className="user-profile-menu-icon">
                      <LogOut
                        size={17}
                      />
                    </span>

                    <span>
                      Log out
                    </span>
                  </button>

                </div>
              )}

            </div>

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

        <section className="user-hero">

          <div className="user-hero-content">

            <div className="user-eyebrow">
              <span className="user-eyebrow-dot" />

              Store discovery
            </div>

            <h1>
              Hi {firstName},{" "}
              <span>
                find your next favorite store.
              </span>
            </h1>

            <p>
              Explore stores, check ratings,
              and share your experience with
              the community.
            </p>

          </div>


          {!loading && (
            <div className="user-hero-stats">

              {/* STORES */}

              <div className="user-mini-stat">

                <div className="user-mini-icon user-mini-blue">
                  <Store size={18} />
                </div>

                <div>
                  <strong>
                    {stores.length}
                  </strong>

                  <span>
                    Stores
                  </span>
                </div>

              </div>


              {/* RATINGS */}

              <div className="user-mini-stat">

                <div className="user-mini-icon user-mini-amber">
                  <Star
                    size={18}
                  />
                </div>

                <div>
                  <strong>
                    {ratedCount}
                  </strong>

                  <span>
                    Your ratings
                  </span>
                </div>

              </div>


              {/* AVERAGE */}

              <div className="user-mini-stat">

                <div className="user-mini-icon user-mini-green">
                  <Star
                    size={18}
                  />
                </div>

                <div>
                  <strong>
                    {averagePlatformRating.toFixed(
                      1
                    )}
                  </strong>

                  <span>
                    Avg. rating
                  </span>
                </div>

              </div>

            </div>
          )}

        </section>


        {/* ===================================================
            MESSAGE
        =================================================== */}

        {message.text && (
          <div
            className={`ui-message ui-message-${message.type}`}
            role={
              message.type === "error"
                ? "alert"
                : "status"
            }
          >

            <span>
              {message.text}
            </span>

            <button
              type="button"
              aria-label="Dismiss message"
              onClick={() =>
                setMessage({
                  type: "",
                  text: "",
                })
              }
            >
              <X size={16} />
            </button>

          </div>
        )}


        {/* ===================================================
            SEARCH + SORT
        =================================================== */}

        <section className="user-discovery-bar">

          {/* SEARCH */}

          <div className="user-search-wrapper">

            <span className="user-search-icon">
              <Search size={18} />
            </span>

            <input
              type="text"
              placeholder="Search stores by name or address..."
              value={searchInput}
              onChange={(event) =>
                setSearchInput(
                  event.target.value
                )
              }
              aria-label="Search stores"
            />

            {searchInput && (
              <button
                type="button"
                className="user-search-clear"
                onClick={() =>
                  setSearchInput("")
                }
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}

          </div>


          {/* SORT */}

          <div className="user-sort-area">

            <span>
              Sort by
            </span>

            <div
              className="ui-tabs"
              role="group"
              aria-label="Sort stores"
            >

              {sortOptions.map(
                (option) => (
                  <button
                    key={
                      option.field
                    }
                    type="button"
                    className={
                      sortBy ===
                      option.field
                        ? "ui-tab ui-tab-active"
                        : "ui-tab"
                    }
                    onClick={() =>
                      handleSort(
                        option.field
                      )
                    }
                  >

                    {option.label}

                    {sortBy ===
                      option.field && (
                      <span className="user-sort-arrow">
                        {order ===
                        "asc"
                          ? "↑"
                          : "↓"}
                      </span>
                    )}

                  </button>
                )
              )}

            </div>


            {isFiltered && (
              <button
                type="button"
                className="ui-clear"
                onClick={
                  clearFilters
                }
              >
                Reset
              </button>
            )}

          </div>

        </section>


        {/* ===================================================
            RESULTS HEADER
        =================================================== */}

        <div className="user-results-header">

          <div>

            <h2>
              Explore stores
            </h2>

            <p>
              {loading
                ? "Finding stores for you..."
                : `${stores.length} ${
                    stores.length ===
                    1
                      ? "store"
                      : "stores"
                  } available`}
            </p>

          </div>


          {!loading &&
            stores.length > 0 && (
              <div className="user-result-badge">
                {ratedCount} rated by you
              </div>
            )}

        </div>


        {/* ===================================================
            LOADING
        =================================================== */}

        {loading ? (

          <div className="ui-store-grid">

            {[...Array(6)].map(
              (_, index) => (
                <div
                  key={index}
                  className="user-skeleton-card"
                >

                  <div className="user-skeleton-top">

                    <div className="user-skeleton-avatar" />

                    <div>
                      <div className="user-skeleton-line short" />
                      <div className="user-skeleton-line tiny" />
                    </div>

                  </div>

                  <div className="user-skeleton-line" />
                  <div className="user-skeleton-line medium" />
                  <div className="user-skeleton-line short" />

                  <div className="user-skeleton-button" />

                </div>
              )
            )}

          </div>

        ) : stores.length === 0 ? (

          /* =================================================
             EMPTY
          ================================================= */

          <div className="ui-card">

            <div className="ui-empty user-empty">

              <div className="user-empty-icon">
                <Store size={24} />
              </div>

              <h3>
                {isFiltered
                  ? "No matching stores"
                  : "No stores available"}
              </h3>

              <p>
                {isFiltered
                  ? "Try changing your search or sorting options."
                  : "There are no stores available to rate yet."}
              </p>

              {isFiltered && (
                <button
                  type="button"
                  className="ui-btn ui-btn-primary"
                  onClick={
                    clearFilters
                  }
                >
                  Clear filters
                </button>
              )}

            </div>

          </div>

        ) : (

          /* =================================================
             STORE GRID
          ================================================= */

          <section className="ui-store-grid user-store-grid">

            {stores.map((store) => {

              const averageRating =
                Number(
                  store.averageRating
                ) || 0;

              const userRating =
                Number(
                  store.userRating
                ) || 0;

              const ratingCount =
                Number(
                  store.ratingsCount
                ) || 0;

              return (
                <article
                  className="user-store-card"
                  key={store.id}
                >

                  {/* CARD HEADER */}

                  <div className="user-store-card-top">

                    <div className="user-store-identity">

                      <div className="user-store-avatar">
                        {store.name
                          ?.charAt(0)
                          ?.toUpperCase() ||
                          "S"}
                      </div>

                      <div className="user-store-name">

                        <span className="user-store-label">
                          STORE
                        </span>

                        <h3
                          title={
                            store.name
                          }
                        >
                          {store.name}
                        </h3>

                      </div>

                    </div>


                    {/* RATING */}

                    <div className="user-rating-box">

                      <strong>
                        {averageRating.toFixed(
                          1
                        )}
                      </strong>

                      <Stars
                        value={
                          averageRating
                        }
                        small
                      />

                      <span>
                        {ratingCount}{" "}
                        {ratingCount ===
                        1
                          ? "rating"
                          : "ratings"}
                      </span>

                    </div>

                  </div>


                  {/* CARD BODY */}

                  <div className="user-store-card-body">

                    {/* LOCATION */}

                    <div className="user-location">

                      <span className="user-location-icon">
                        <MapPin
                          size={16}
                        />
                      </span>

                      <span
                        title={
                          store.address
                        }
                      >
                        {store.address ||
                          "Address unavailable"}
                      </span>

                    </div>


                    <div className="user-card-divider" />


                    {/* USER RATING */}

                    <div className="user-your-rating">

                      <div>

                        <span className="user-your-label">
                          YOUR RATING
                        </span>

                        {userRating > 0 ? (

                          <div className="user-rated-display">

                            <Stars
                              value={
                                userRating
                              }
                              small
                            />

                            <strong>
                              {userRating}/5
                            </strong>

                          </div>

                        ) : (

                          <p>
                            You haven't rated
                            this store yet.
                          </p>

                        )}

                      </div>


                      {userRating > 0 && (
                        <span className="user-rated-badge">
                          Rated
                        </span>
                      )}

                    </div>

                  </div>


                  {/* ACTION */}

                  <button
                    type="button"
                    className={
                      userRating
                        ? "user-rate-btn user-rate-btn-rated"
                        : "user-rate-btn"
                    }
                    onClick={() =>
                      openRating(store)
                    }
                  >

                    <span>
                      {userRating
                        ? "Update your rating"
                        : "Rate this store"}
                    </span>

                    <ArrowRight
                      size={17}
                      className="user-rate-arrow"
                    />

                  </button>

                </article>
              );
            })}

          </section>
        )}

      </main>


      {/* =====================================================
          RATING MODAL
      ===================================================== */}

      {selectedStore && (
        <div
          className="user-rating-overlay"
          onClick={closeRating}
        >

          <div
            className="user-rating-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rating-modal-title"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* CLOSE */}

            <button
              type="button"
              className="user-modal-close"
              onClick={closeRating}
              disabled={submitting}
              aria-label="Close rating modal"
            >
              <X size={19} />
            </button>


            {/* ICON */}

            <div className="user-modal-icon">
              <Star
                size={24}
                fill="currentColor"
              />
            </div>


            <span className="user-modal-eyebrow">
              {selectedStore.userRating
                ? "UPDATE RATING"
                : "RATE STORE"}
            </span>


            <h2
              id="rating-modal-title"
              title={
                selectedStore.name
              }
            >
              {selectedStore.name}
            </h2>


            <p>
              How was your experience
              with this store?
            </p>


            {/* STARS */}

            <div
              className="user-big-stars"
              role="radiogroup"
              aria-label="Select rating"
            >

              {[1, 2, 3, 4, 5].map(
                (value) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={
                      rating === value
                    }
                    aria-label={`${value} star${
                      value > 1
                        ? "s"
                        : ""
                    }`}
                    className={
                      value <= rating
                        ? "user-big-star active"
                        : "user-big-star"
                    }
                    onClick={() => {
                      setRating(
                        value
                      );
                      setModalError(
                        ""
                      );
                    }}
                  >
                    ★
                  </button>
                )
              )}

            </div>


            {/* SELECTED RATING */}

            <div className="user-rating-selected">
              {rating
                ? ratingLabels[
                    rating
                  ]
                : "Select a rating"}
            </div>


            {/* ERROR */}

            {modalError && (
              <div
                className="ui-message ui-message-error"
                role="alert"
              >
                {modalError}
              </div>
            )}


            {/* SUBMIT */}

            <button
              type="button"
              className="user-submit-rating"
              onClick={
                submitRating
              }
              disabled={submitting}
            >
              {submitting
                ? "Saving rating..."
                : selectedStore.userRating
                ? "Update rating"
                : "Submit rating"}
            </button>


            <span className="user-modal-note">
              Your rating helps other
              customers make better
              decisions.
            </span>

          </div>

        </div>
      )}

    </div>
  );
};

export default UserDashboard;