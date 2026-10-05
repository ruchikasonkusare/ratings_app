import {
  Activity,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  Store,
  Star,
  UserRound,
  Users,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import api from "../../services/api";
import AdminLayout from "../../components/AdminLayout";
import { useAuth } from "../../context/AuthContext";
import "../../../src/global.css";


const ROLE_LABEL = {
  USER: "User",
  OWNER: "Store owner",
  ADMIN: "Admin",
};


/* ----------------------------- Helpers ----------------------------- */

const getList = (result, key) => {
  if (result.status !== "fulfilled") {
    return [];
  }

  const response = result.value?.data;
  const data = response?.data ?? response;

  if (Array.isArray(data)) {
    return data;
  }

  return Array.isArray(data?.[key]) ? data[key] : [];
};


const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";

  return "Good evening";
};


const getFirstName = (name) => {
  return name?.trim()?.split(/\s+/)[0] || "";
};


const getRatingCount = (store) => {
  return (
    store?._count?.ratings ??
    store?.ratingsCount ??
    store?.totalRatings ??
    0
  );
};


const formatDate = () => {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};


const ratio = (value, total) => {
  if (!total) return "0.0";

  return (value / total).toFixed(1);
};


/* ---------------------------- Count Up ----------------------------- */

const useCountUp = (target, enabled) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setValue(0);
      return;
    }

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reducedMotion) {
      setValue(target);
      return;
    }

    let animationFrame;
    let startTime = null;

    const animate = (timestamp) => {
      if (startTime === null) {
        startTime = timestamp;
      }

      const progress = Math.min(
        (timestamp - startTime) / 800,
        1
      );

      const easedProgress =
        1 - Math.pow(1 - progress, 3);

      setValue(
        Math.round(target * easedProgress)
      );

      if (progress < 1) {
        animationFrame =
          requestAnimationFrame(animate);
      }
    };

    animationFrame =
      requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [target, enabled]);

  return value;
};


/* ------------------------------ KPI -------------------------------- */

const Kpi = ({
  tone,
  icon: Icon,
  label,
  value,
  note,
  loading,
  onClick,
}) => {
  const count = useCountUp(
    value,
    !loading
  );

  const Component = onClick ? "button" : "div";

  return (
    <Component
      type={onClick ? "button" : undefined}
      className={`ad-kpi ad-kpi-${tone} ${
        onClick ? "ad-kpi-link" : ""
      }`}
      onClick={onClick}
    >
      <span className="ad-kpi-top">
        <span className="ad-kpi-icon">
          <Icon size={21} strokeWidth={2} />
        </span>

        {label}
      </span>

      <strong className="ad-kpi-value">
        {loading
          ? "—"
          : count.toLocaleString()}
      </strong>

      <span className="ad-kpi-note">
        {note}
      </span>

      <span
        className="ad-kpi-mark"
        aria-hidden="true"
      >
        <Icon
          size={48}
          strokeWidth={1.5}
        />
      </span>
    </Component>
  );
};


/* ------------------------- Admin Dashboard ------------------------- */

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stats, setStats] = useState({
    users: 0,
    stores: 0,
    ratings: 0,
  });

  const [topStores, setTopStores] = useState([]);
  const [newestUsers, setNewestUsers] = useState([]);

  const [roles, setRoles] = useState({
    USER: 0,
    OWNER: 0,
    ADMIN: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ------------------------- Fetch dashboard ---------------------- */

  const fetchDashboard = useCallback(
    async (signal) => {
      try {
        setLoading(true);
        setError("");

        const results =
          await Promise.allSettled([
            api.get("/admin/dashboard", {
              signal,
            }),

            api.get("/admin/stores", {
              params: {
                sortBy: "averageRating",
                order: "desc",
              },
              signal,
            }),

            api.get("/admin/users", {
              signal,
            }),
          ]);

        const [
          dashboardRes,
          storesRes,
          usersRes,
        ] = results;

        /* ------------------------- Main stats ---------------------- */

        if (
          dashboardRes.status ===
          "rejected"
        ) {
          throw dashboardRes.reason;
        }

        const dashboardData =
          dashboardRes.value?.data?.data ??
          dashboardRes.value?.data ??
          {};

        setStats({
          users:
            Number(dashboardData.totalUsers) ||
            0,

          stores:
            Number(dashboardData.totalStores) ||
            0,

          ratings:
            Number(dashboardData.totalRatings) ||
            0,
        });

        /* ------------------------- Stores -------------------------- */

        const storeList = getList(
          storesRes,
          "stores"
        );

        const ratedStores = storeList
          .filter(
            (store) =>
              getRatingCount(store) > 0
          )
          .sort(
            (a, b) =>
              Number(b.averageRating || 0) -
              Number(a.averageRating || 0)
          )
          .slice(0, 5);

        setTopStores(ratedStores);

        /* -------------------------- Users -------------------------- */

        const userList = getList(
          usersRes,
          "users"
        );

        const roleCounts = {
          USER: 0,
          OWNER: 0,
          ADMIN: 0,
        };

        userList.forEach((userItem) => {
          if (
            Object.prototype.hasOwnProperty.call(
              roleCounts,
              userItem.role
            )
          ) {
            roleCounts[userItem.role]++;
          }
        });

        setRoles(roleCounts);

        const latestUsers = [...userList]
          .sort((a, b) => {
            if (
              a.createdAt &&
              b.createdAt
            ) {
              return (
                new Date(b.createdAt) -
                new Date(a.createdAt)
              );
            }

            return (
              Number(b.id) -
              Number(a.id)
            );
          })
          .slice(0, 5);

        setNewestUsers(latestUsers);

      } catch (err) {
        if (
          err.name === "CanceledError" ||
          err.code === "ERR_CANCELED"
        ) {
          return;
        }

        console.error(
          "Failed to load dashboard:",
          err
        );

        setError(
          err.response?.data?.message ||
            "Unable to load dashboard numbers."
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    []
  );


  /* ---------------------------- Initial load ---------------------- */

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


  /* -------------------------- Derived data ------------------------- */

  const roleTotal = useMemo(
    () =>
      roles.USER +
      roles.OWNER +
      roles.ADMIN,
    [roles]
  );


  const rolePercentages = useMemo(() => {
    if (!roleTotal) {
      return {
        USER: 0,
        OWNER: 0,
        ADMIN: 0,
      };
    }

    return {
      USER:
        (roles.USER / roleTotal) * 100,

      OWNER:
        (roles.OWNER / roleTotal) * 100,

      ADMIN:
        (roles.ADMIN / roleTotal) * 100,
    };
  }, [roles, roleTotal]);


  const insights = useMemo(
    () => [
      {
        label: "Ratings per store",
        value: ratio(
          stats.ratings,
          stats.stores
        ),
      },
      {
        label: "Ratings per user",
        value: ratio(
          stats.ratings,
          stats.users
        ),
      },
      {
        label: "Users per store",
        value: ratio(
          stats.users,
          stats.stores
        ),
      },
    ],
    [stats]
  );


  const firstName = useMemo(
    () => getFirstName(user?.name),
    [user?.name]
  );


  const greeting = useMemo(
    () => getGreeting(),
    []
  );


  const today = useMemo(
    () => formatDate(),
    []
  );


  /* ----------------------------- Render ---------------------------- */

  return (
    <AdminLayout>
      <div className="ui-page">

        {/* ========================= HEADER ========================= */}

        <header className="ui-header">
          <div>
            <h1>
              {firstName
                ? `${greeting}, ${firstName}`
                : "Dashboard"}
            </h1>

            <p>
              Here's how your rating
              platform is doing today.
            </p>

            <p className="ad-date">
              {today}
            </p>
          </div>

          <button
            className="ui-btn"
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
              ? "Refreshing"
              : "Refresh"}
          </button>
        </header>


        {/* =========================== ERROR ======================== */}

        {error && (
          <div
            className="ui-message ui-message-error"
            role="alert"
          >
            <span>{error}</span>

            <button
              type="button"
              onClick={() =>
                fetchDashboard()
              }
            >
              Try again
            </button>
          </div>
        )}


        {/* ============================ KPI ========================= */}

        <section
          className="ad-kpis"
          aria-label="Platform totals"
        >
          <Kpi
            tone="users"
            icon={Users}
            label="Total users"
            value={stats.users}
            note="Registered on the platform"
            loading={loading}
            onClick={() =>
              navigate("/admin/users")
            }
          />

          <Kpi
            tone="stores"
            icon={Store}
            label="Total stores"
            value={stats.stores}
            note="Listed and open for rating"
            loading={loading}
            onClick={() =>
              navigate("/admin/stores")
            }
          />

          <Kpi
            tone="ratings"
            icon={Star}
            label="Total ratings"
            value={stats.ratings}
            note="Submitted by users"
            loading={loading}
          />
        </section>


        {/* ====================== ACTIVITY + MANAGE ================= */}

        <div className="ad-row2">

          {/* Activity */}

          <section className="ui-card ui-panel">
            <div className="ui-panel-head">
              <h2>Platform activity</h2>

              <p>
                How much engagement each
                part of the platform gets.
              </p>
            </div>


            <div className="ad-insights">
              {insights.map((item) => (
                <div
                  className="ad-insight"
                  key={item.label}
                >
                  <strong>
                    {loading
                      ? "—"
                      : item.value}
                  </strong>

                  <span>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>


            <p className="ad-subhead">
              Who is on the platform
            </p>


            {roleTotal > 0 ? (
              <>
                <div
                  className="ad-bar"
                  role="img"
                  aria-label={`${roles.USER} users, ${roles.OWNER} store owners, ${roles.ADMIN} admins`}
                >
                  <div
                    className="ad-bar-seg ad-seg-user"
                    style={{
                      width: `${rolePercentages.USER}%`,
                    }}
                  />

                  <div
                    className="ad-bar-seg ad-seg-owner"
                    style={{
                      width: `${rolePercentages.OWNER}%`,
                    }}
                  />

                  <div
                    className="ad-bar-seg ad-seg-admin"
                    style={{
                      width: `${rolePercentages.ADMIN}%`,
                    }}
                  />
                </div>


                <div className="ad-legend">
                  <span>
                    <i className="ad-seg-user" />
                    Users
                    <b>{roles.USER}</b>
                  </span>

                  <span>
                    <i className="ad-seg-owner" />
                    Store owners
                    <b>{roles.OWNER}</b>
                  </span>

                  <span>
                    <i className="ad-seg-admin" />
                    Admins
                    <b>{roles.ADMIN}</b>
                  </span>
                </div>
              </>
            ) : (
              <p className="ad-list-empty">
                {loading
                  ? "Loading…"
                  : "No users to show yet."}
              </p>
            )}
          </section>


          {/* Manage */}

          <section className="ui-card ui-panel">
            <div className="ui-panel-head">
              <h2>Manage</h2>

              <p>
                Jump to the area you want
                to work on.
              </p>
            </div>


            <div className="ad-links">

              <button
                type="button"
                onClick={() =>
                  navigate("/admin/users")
                }
              >
                <span className="ad-link-icon ad-users">
                  <Users
                    size={20}
                  />
                </span>

                <span>
                  <strong>
                    Users
                  </strong>

                  <small>
                    Add, search and edit
                    accounts
                  </small>
                </span>

                <ArrowRight
                  size={18}
                />
              </button>


              <button
                type="button"
                onClick={() =>
                  navigate("/admin/stores")
                }
              >
                <span className="ad-link-icon ad-stores">
                  <Store
                    size={20}
                  />
                </span>

                <span>
                  <strong>
                    Stores
                  </strong>

                  <small>
                    Add stores and assign
                    owners
                  </small>
                </span>

                <ArrowRight
                  size={18}
                />
              </button>

            </div>
          </section>
        </div>


        {/* ================= TOP STORES + USERS ===================== */}

        <div className="ad-row2">

          {/* Top Stores */}

          <section className="ui-card ui-panel">
            <div className="ui-panel-head">
              <h2>
                Top rated stores
              </h2>

              <p>
                Stores with the highest
                average rating.
              </p>
            </div>


            {loading ? (
              <div
                className="ui-skeleton-bar"
                style={{
                  height: 160,
                }}
              />
            ) : topStores.length === 0 ? (
              <p className="ad-list-empty">
                No ratings yet. Top stores
                will appear here.
              </p>
            ) : (
              <div className="ad-rank">
                {topStores.map(
                  (store, index) => {
                    const average =
                      Number(
                        store.averageRating ||
                          0
                      );

                    const ratingCount =
                      getRatingCount(
                        store
                      );

                    return (
                      <div
                        className="ad-rank-row"
                        key={store.id}
                      >
                        <span className="ad-rank-num">
                          {index + 1}
                        </span>


                        <div className="ad-rank-main">
                          <strong>
                            {store.name}
                          </strong>

                          <div className="ui-dist-track">
                            <div
                              className="ui-dist-fill"
                              style={{
                                width: `${Math.min(
                                  (average / 5) *
                                    100,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>


                        <div className="ad-rank-score">
                          <strong>
                            <Star
                              size={14}
                              fill="currentColor"
                            />{" "}
                            {average.toFixed(
                              1
                            )}
                          </strong>

                          <span>
                            {ratingCount}{" "}
                            {ratingCount ===
                            1
                              ? "rating"
                              : "ratings"}
                          </span>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}


            <button
              type="button"
              className="ad-more"
              onClick={() =>
                navigate(
                  "/admin/stores"
                )
              }
            >
              View all stores
              <ArrowRight size={15} />
            </button>
          </section>


          {/* Newest Users */}

          <section className="ui-card ui-panel">
            <div className="ui-panel-head">
              <h2>
                Newest users
              </h2>

              <p>
                The latest accounts added
                to the platform.
              </p>
            </div>


            {loading ? (
              <div
                className="ui-skeleton-bar"
                style={{
                  height: 160,
                }}
              />
            ) : newestUsers.length ===
              0 ? (
              <p className="ad-list-empty">
                No users yet.
              </p>
            ) : (
              <div className="ad-feed">
                {newestUsers.map(
                  (item) => {
                    const role =
                      item.role ||
                      "USER";

                    const roleClass =
                      role.toLowerCase();

                    return (
                      <div
                        className="ui-feed-row"
                        key={item.id}
                      >
                        <div
                          className={`ui-avatar ui-avatar-${roleClass}`}
                        >
                          {item.name
                            ?.charAt(
                              0
                            )
                            ?.toUpperCase() ||
                            "?"}
                        </div>


                        <div className="ui-feed-info">
                          <strong>
                            {item.name}
                          </strong>

                          <span>
                            {item.email}
                          </span>
                        </div>


                        <span
                          className={`ui-role ui-role-${roleClass}`}
                        >
                          {ROLE_LABEL[
                            role
                          ] || role}
                        </span>
                      </div>
                    );
                  }
                )}
              </div>
            )}


            <button
              type="button"
              className="ad-more"
              onClick={() =>
                navigate(
                  "/admin/users"
                )
              }
            >
              View all users
              <ArrowRight size={15} />
            </button>
          </section>
        </div>

      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;