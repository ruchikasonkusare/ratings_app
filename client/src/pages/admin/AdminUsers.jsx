import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import AdminLayout from "../../components/AdminLayout";

const EMPTY_FORM = {
  name: "",
  email: "",
  password: "",
  address: "",
  role: "USER",
};

const ROLE_TABS = [
  { value: "", label: "All" },
  { value: "USER", label: "Users" },
  { value: "OWNER", label: "Owners" },
  { value: "ADMIN", label: "Admins" },
];

const ROLE_LABEL = {
  USER: "User",
  OWNER: "Store owner",
  ADMIN: "Admin",
};

const Icon = ({ children }) => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className="ui-icon"
  >
    {children}
  </svg>
);

const SearchIcon = () => (
  <Icon>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4 4" />
  </Icon>
);

const PlusIcon = () => (
  <Icon>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);

const AdminUsers = () => {
  const navigate = useNavigate();

  /* =========================
     USERS
  ========================= */

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  /* =========================
     SEARCH / FILTER / SORT
  ========================= */

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [role, setRole] = useState("");

  const [sortBy, setSortBy] = useState("name");
  const [order, setOrder] = useState("asc");

  /* =========================
     MODAL
  ========================= */

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const [formLoading, setFormLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  /* =========================
     MESSAGE
  ========================= */

  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  /* =====================================================
     SEARCH DEBOUNCE
  ===================================================== */

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  /* =====================================================
     FETCH USERS
  ===================================================== */

  const fetchUsers = useCallback(
    async (signal) => {
      try {
        setLoading(true);

        const response = await api.get("/admin/users", {
          params: {
            search,
            role,
            sortBy,
            order,
          },
          signal,
        });

        const data = response.data?.data ?? response.data;

        const userList = Array.isArray(data)
          ? data
          : data?.users || [];

        setUsers(userList);

        /*
         * Clear old page error after successful request.
         */
        setMessage((previous) =>
          previous.type === "error"
            ? { type: "", text: "" }
            : previous
        );
      } catch (error) {
        /*
         * Ignore intentionally cancelled requests.
         */
        if (
          error.name === "CanceledError" ||
          error.code === "ERR_CANCELED"
        ) {
          return;
        }

        console.error(
          "Failed to load users:",
          error
        );

        setUsers([]);

        setMessage({
          type: "error",
          text:
            error.response?.data?.message ||
            "Failed to load users.",
        });
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [search, role, sortBy, order]
  );

  /* =====================================================
     LOAD USERS WHEN FILTER / SORT CHANGES
  ===================================================== */

  useEffect(() => {
    const controller = new AbortController();

    fetchUsers(controller.signal);

    return () => {
      controller.abort();
    };
  }, [fetchUsers]);

  /* =====================================================
     ESCAPE → CLOSE MODAL
  ===================================================== */

  useEffect(() => {
    if (!showModal) return;

    const handleEscape = (event) => {
      if (
        event.key === "Escape" &&
        !formLoading
      ) {
        setShowModal(false);
      }
    };

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [showModal, formLoading]);

  /* =====================================================
     FORM CHANGE
  ===================================================== */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (modalError) {
      setModalError("");
    }
  };

  /* =====================================================
     OPEN MODAL
  ===================================================== */

  const openModal = () => {
    setForm(EMPTY_FORM);
    setModalError("");

    setMessage({
      type: "",
      text: "",
    });

    setShowModal(true);
  };

  /* =====================================================
     CLOSE MODAL
  ===================================================== */

  const closeModal = () => {
    if (formLoading) return;

    setShowModal(false);
    setModalError("");
  };

  /* =====================================================
     CREATE USER
  ===================================================== */

  const handleCreateUser = async (event) => {
    event.preventDefault();

    if (formLoading) return;

    try {
      setFormLoading(true);
      setModalError("");

      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        address: form.address.trim(),
        role: form.role,
      };

      await api.post(
        "/admin/users",
        payload
      );

      setMessage({
        type: "success",
        text: "User created successfully.",
      });

      setForm(EMPTY_FORM);
      setShowModal(false);

      /*
       * Refresh users after successful creation.
       */
      await fetchUsers();
    } catch (error) {
      console.error(
        "Create user error:",
        error
      );

      setModalError(
        error.response?.data?.message ||
          "Failed to create user."
      );
    } finally {
      setFormLoading(false);
    }
  };

  /* =====================================================
     SORT
  ===================================================== */

  const toggleSort = (field) => {
    if (sortBy === field) {
      setOrder((previous) =>
        previous === "asc"
          ? "desc"
          : "asc"
      );

      return;
    }

    setSortBy(field);
    setOrder("asc");
  };

  const sortMark = (field) => {
    if (sortBy !== field) {
      return "↕";
    }

    return order === "asc" ? "↑" : "↓";
  };

  const ariaSort = (field) => {
    if (sortBy !== field) {
      return "none";
    }

    return order === "asc"
      ? "ascending"
      : "descending";
  };

  /* =====================================================
     HELPERS
  ===================================================== */

  const getInitials = (name) => {
    if (!name?.trim()) {
      return "?";
    }

    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  /* =====================================================
     FILTER STATE
  ===================================================== */

  const hasFilters =
    Boolean(searchInput.trim()) ||
    Boolean(role);

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setRole("");
  };

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <AdminLayout>
      <div className="ui-page">

        {/* ================= HEADER ================= */}

        <header className="ui-header">
          <div>
            <h1>Users</h1>

            <p>
              Search, filter and manage
              everyone on the platform.
            </p>
          </div>

          <button
            className="ui-btn ui-btn-primary"
            onClick={openModal}
          >
            <PlusIcon />
            Create user
          </button>
        </header>

        {/* ================= MESSAGE ================= */}

        {message.text && (
          <div
            className={`ui-message ui-message-${message.type}`}
            role={
              message.type === "error"
                ? "alert"
                : "status"
            }
          >
            <span>{message.text}</span>

            <button
              aria-label="Dismiss message"
              onClick={() =>
                setMessage({
                  type: "",
                  text: "",
                })
              }
            >
              ×
            </button>
          </div>
        )}

        {/* ================= TABLE CARD ================= */}

        <section className="ui-card">

          {/* ================= TOOLBAR ================= */}

          <div className="ui-toolbar">

            {/* SEARCH */}

            <div className="ui-search">
              <SearchIcon />

              <input
                type="text"
                placeholder="Search by name or email"
                aria-label="Search users"
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(
                    event.target.value
                  )
                }
              />
            </div>

            {/* ROLE FILTER */}

            <div
              className="ui-tabs"
              role="tablist"
              aria-label="Filter by role"
            >
              {ROLE_TABS.map((tab) => (
                <button
                  key={tab.value || "all"}
                  type="button"
                  role="tab"
                  aria-selected={
                    role === tab.value
                  }
                  className={
                    role === tab.value
                      ? "ui-tab ui-tab-active"
                      : "ui-tab"
                  }
                  onClick={() =>
                    setRole(tab.value)
                  }
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* CLEAR */}

            {hasFilters && (
              <button
                className="ui-clear"
                onClick={clearFilters}
              >
                Clear filters
              </button>
            )}
          </div>

          {/* ================= COUNT ================= */}

          <div className="ui-count">
            {loading
              ? "Loading users…"
              : `${users.length} ${
                  users.length === 1
                    ? "user"
                    : "users"
                }`}
          </div>

          {/* ================= TABLE ================= */}

          <div className="ui-table-wrap">
            <table className="ui-table">

              <thead>
                <tr>

                  <th className="ui-col-id">
                    ID
                  </th>

                  <th
                    aria-sort={ariaSort(
                      "name"
                    )}
                  >
                    <button
                      type="button"
                      className="ui-sort"
                      onClick={() =>
                        toggleSort("name")
                      }
                    >
                      User
                      <span>
                        {sortMark("name")}
                      </span>
                    </button>
                  </th>

                  <th
                    aria-sort={ariaSort(
                      "email"
                    )}
                  >
                    <button
                      type="button"
                      className="ui-sort"
                      onClick={() =>
                        toggleSort("email")
                      }
                    >
                      Email
                      <span>
                        {sortMark("email")}
                      </span>
                    </button>
                  </th>

                  <th>
                    Role
                  </th>

                  <th>
                    Address
                  </th>

                  <th className="ui-col-action">
                    <span className="ui-sr">
                      Actions
                    </span>
                  </th>

                </tr>
              </thead>

              <tbody>

                {/* ================= LOADING ================= */}

                {loading ? (
                  [...Array(5)].map(
                    (_, index) => (
                      <tr
                        key={index}
                        className="ui-skeleton-row"
                        aria-hidden="true"
                      >
                        <td colSpan="6">
                          <div className="ui-skeleton-bar" />
                        </td>
                      </tr>
                    )
                  )
                ) : users.length === 0 ? (

                  /* ================= EMPTY ================= */

                  <tr>
                    <td colSpan="6">

                      <div className="ui-empty">

                        <div className="ui-empty-icon">
                          <Icon>
                            <circle
                              cx="9"
                              cy="8"
                              r="3.5"
                            />

                            <path d="M2.5 20c.6-3.4 3.2-5.5 6.5-5.5s5.9 2.1 6.5 5.5" />
                          </Icon>
                        </div>

                        <h3>
                          No users found
                        </h3>

                        <p>
                          {hasFilters
                            ? "Nothing matches your search or role filter."
                            : "Create the first user to get started."}
                        </p>

                        {hasFilters ? (
                          <button
                            className="ui-btn"
                            onClick={
                              clearFilters
                            }
                          >
                            Clear filters
                          </button>
                        ) : (
                          <button
                            className="ui-btn ui-btn-primary"
                            onClick={
                              openModal
                            }
                          >
                            Create user
                          </button>
                        )}

                      </div>

                    </td>
                  </tr>

                ) : (

                  /* ================= USERS ================= */

                  users.map((user) => (
                    <tr key={user.id}>

                      {/* ID */}

                      <td className="ui-col-id ui-muted">
                        #{user.id}
                      </td>

                      {/* USER */}

                      <td>
                        <div className="ui-user">

                          <div
                            className={`ui-avatar ui-avatar-${user.role?.toLowerCase()}`}
                          >
                            {getInitials(
                              user.name
                            )}
                          </div>

                          <strong>
                            {user.name}
                          </strong>

                        </div>
                      </td>

                      {/* EMAIL */}

                      <td className="ui-muted">
                        {user.email}
                      </td>

                      {/* ROLE */}

                      <td>
                        <span
                          className={`ui-role ui-role-${user.role?.toLowerCase()}`}
                        >
                          {ROLE_LABEL[
                            user.role
                          ] ||
                            user.role}
                        </span>
                      </td>

                      {/* ADDRESS */}

                      <td
                        className="ui-address"
                        title={
                          user.address || ""
                        }
                      >
                        {user.address || "—"}
                      </td>

                      {/* ACTION */}

                      <td className="ui-col-action">
                        <button
                          className="ui-view"
                          onClick={() =>
                            navigate(
                              `/admin/users/${user.id}`
                            )
                          }
                        >
                          View
                        </button>
                      </td>

                    </tr>
                  ))

                )}

              </tbody>
            </table>
          </div>
        </section>

        {/* ================= CREATE USER MODAL ================= */}

        {showModal && (
          <div
            className="ui-overlay"
            onClick={closeModal}
          >
            <div
              className="ui-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="ui-modal-title"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              {/* MODAL HEADER */}

              <div className="ui-modal-head">

                <div>
                  <h2 id="ui-modal-title">
                    Create user
                  </h2>

                  <p>
                    Add a new account
                    to the platform.
                  </p>
                </div>

                <button
                  className="ui-close"
                  aria-label="Close"
                  onClick={closeModal}
                  disabled={formLoading}
                >
                  ×
                </button>

              </div>

              {/* ERROR */}

              {modalError && (
                <div
                  className="ui-message ui-message-error"
                  role="alert"
                >
                  <span>
                    {modalError}
                  </span>
                </div>
              )}

              {/* FORM */}

              <form
                onSubmit={
                  handleCreateUser
                }
              >

                {/* NAME */}

                <div className="ui-field">

                  <label htmlFor="ui-name">
                    Full name
                  </label>

                  <input
                    id="ui-name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    required
                    minLength={20}
                    maxLength={60}
                    autoFocus
                    disabled={formLoading}
                  />

                  <small>
                    Between 20 and 60
                    characters.
                  </small>

                </div>

                {/* EMAIL */}

                <div className="ui-field">

                  <label htmlFor="ui-email">
                    Email
                  </label>

                  <input
                    id="ui-email"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="user@example.com"
                    required
                    disabled={formLoading}
                  />

                </div>

                {/* PASSWORD */}

                <div className="ui-field">

                  <label htmlFor="ui-password">
                    Password
                  </label>

                  <input
                    id="ui-password"
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter password"
                    required
                    minLength={8}
                    maxLength={16}
                    disabled={formLoading}
                  />

                  <small>
                    8–16 characters with at
                    least one uppercase letter
                    and one special character.
                  </small>

                </div>

                {/* ADDRESS */}

                <div className="ui-field">

                  <label htmlFor="ui-address">
                    Address
                  </label>

                  <textarea
                    id="ui-address"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Enter address"
                    rows="3"
                    maxLength={400}
                    required
                    disabled={formLoading}
                  />

                  <small>
                    {form.address.length}/400
                    characters.
                  </small>

                </div>

                {/* ROLE */}

                <div className="ui-field">

                  <label htmlFor="ui-role">
                    Role
                  </label>

                  <select
                    id="ui-role"
                    name="role"
                    value={form.role}
                    onChange={handleChange}
                    disabled={formLoading}
                  >
                    <option value="USER">
                      User
                    </option>

                    <option value="OWNER">
                      Store owner
                    </option>

                    <option value="ADMIN">
                      Admin
                    </option>
                  </select>

                </div>

                {/* ACTIONS */}

                <div className="ui-modal-actions">

                  <button
                    type="button"
                    className="ui-btn"
                    onClick={closeModal}
                    disabled={formLoading}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="ui-btn ui-btn-primary"
                    disabled={formLoading}
                  >
                    {formLoading
                      ? "Creating…"
                      : "Create user"}
                  </button>

                </div>

              </form>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};

export default AdminUsers;