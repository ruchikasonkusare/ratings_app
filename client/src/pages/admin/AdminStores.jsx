import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import AdminLayout from "../../components/AdminLayout";

const EMPTY_FORM = {
  name: "",
  email: "",
  address: "",
  ownerId: "",
};

const SORT_OPTIONS = [
  { field: "name", label: "Name" },
  { field: "averageRating", label: "Rating" },
];

const Icon = ({ children }) => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className="ui-icon"
  >
    {children}
  </svg>
);

const AdminStores = () => {
  const navigate = useNavigate();

  /* =========================
     STORE STATE
  ========================= */

  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  /* =========================
     OWNER STATE
  ========================= */

  const [owners, setOwners] = useState([]);

  /* =========================
     SEARCH / SORT STATE
  ========================= */

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [sortBy, setSortBy] = useState("name");
  const [order, setOrder] = useState("asc");

  /* =========================
     MODAL STATE
  ========================= */

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formLoading, setFormLoading] = useState(false);
  const [modalError, setModalError] = useState("");

  /* =========================
     PAGE MESSAGE
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
     FETCH STORES
  ===================================================== */

  const fetchStores = useCallback(
    async (signal) => {
      try {
        setLoading(true);

        const response = await api.get("/admin/stores", {
          params: {
            search,
            sortBy,
            order,
          },
          signal,
        });

        const data = response.data?.data ?? response.data;

        const storeList = Array.isArray(data)
          ? data
          : data?.stores || [];

        setStores(storeList);

        /*
         * Clear previous error after successful request.
         */
        setMessage((previous) =>
          previous.type === "error"
            ? { type: "", text: "" }
            : previous
        );
      } catch (error) {
        /*
         * Ignore cancelled requests.
         */
        if (
          error.name === "CanceledError" ||
          error.code === "ERR_CANCELED"
        ) {
          return;
        }

        console.error("Failed to load stores:", error);

        setStores([]);

        setMessage({
          type: "error",
          text:
            error.response?.data?.message ||
            "Failed to load stores.",
        });
      } finally {
        /*
         * Don't unnecessarily change loading state
         * for cancelled requests.
         */
        if (
          !signal?.aborted
        ) {
          setLoading(false);
        }
      }
    },
    [search, sortBy, order]
  );

  /* =====================================================
     FETCH STORES WHEN SEARCH / SORT CHANGES
  ===================================================== */

  useEffect(() => {
    const controller = new AbortController();

    fetchStores(controller.signal);

    return () => {
      controller.abort();
    };
  }, [fetchStores]);

  /* =====================================================
     FETCH OWNERS
  ===================================================== */

  useEffect(() => {
    const controller = new AbortController();

    const fetchOwners = async () => {
      try {
        const response = await api.get("/admin/users", {
          params: {
            role: "OWNER",
          },
          signal: controller.signal,
        });

        const data = response.data?.data ?? response.data;

        const userList = Array.isArray(data)
          ? data
          : data?.users || [];

        const ownerList = userList.filter(
          (user) => user.role === "OWNER"
        );

        setOwners(ownerList);
      } catch (error) {
        if (
          error.name === "CanceledError" ||
          error.code === "ERR_CANCELED"
        ) {
          return;
        }

        console.error(
          "Failed to load owners:",
          error
        );
      }
    };

    fetchOwners();

    return () => {
      controller.abort();
    };
  }, []);

  /* =====================================================
     ESCAPE → CLOSE MODAL
  ===================================================== */

  useEffect(() => {
    if (!showModal) return;

    const handleEscape = (event) => {
      if (event.key === "Escape" && !formLoading) {
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
     SORT
  ===================================================== */

  const handleSort = (field) => {
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

  /* =====================================================
     FORM
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
     CREATE STORE
  ===================================================== */

  const handleCreateStore = async (event) => {
    event.preventDefault();

    if (formLoading) return;

    try {
      setFormLoading(true);
      setModalError("");

      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        address: form.address.trim(),
        ownerId: form.ownerId
          ? Number(form.ownerId)
          : null,
      };

      await api.post(
        "/admin/stores",
        payload
      );

      setMessage({
        type: "success",
        text: "Store created successfully.",
      });

      setForm(EMPTY_FORM);
      setShowModal(false);

      /*
       * Refresh store list after successful creation.
       *
       * This is intentional:
       * POST /stores
       *       ↓
       * GET /stores
       */
      await fetchStores();
    } catch (error) {
      console.error(
        "Create store error:",
        error
      );

      setModalError(
        error.response?.data?.message ||
          "Failed to create store."
      );
    } finally {
      setFormLoading(false);
    }
  };

  /* =====================================================
     CLEAR FILTERS
  ===================================================== */

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");

    setSortBy("name");
    setOrder("asc");
  };

  /* =====================================================
     FILTER STATUS
  ===================================================== */

  const isFiltered =
    Boolean(searchInput.trim()) ||
    sortBy !== "name" ||
    order !== "asc";

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <AdminLayout>
      <div className="ui-page">

        {/* ================= HEADER ================= */}

        <header className="ui-header">
          <div>
            <h1>Stores</h1>

            <p>
              Manage registered stores,
              their owners and ratings.
            </p>
          </div>

          <button
            className="ui-btn ui-btn-primary"
            onClick={openModal}
          >
            <Icon>
              <path d="M12 5v14M5 12h14" />
            </Icon>

            Add store
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

        {/* ================= TOOLBAR ================= */}

        <section
          className="ui-card"
          style={{ marginBottom: 18 }}
        >
          <div className="ui-toolbar">

            {/* SEARCH */}

            <div className="ui-search">
              <Icon>
                <circle
                  cx="11"
                  cy="11"
                  r="6.5"
                />

                <path d="m16 16 4 4" />
              </Icon>

              <input
                type="text"
                placeholder="Search by store name or address"
                aria-label="Search stores"
                value={searchInput}
                onChange={(event) =>
                  setSearchInput(
                    event.target.value
                  )
                }
              />
            </div>

            {/* SORT */}

            <div
              className="ui-tabs"
              role="group"
              aria-label="Sort stores"
            >
              {SORT_OPTIONS.map(
                (option) => (
                  <button
                    key={option.field}
                    className={
                      sortBy === option.field
                        ? "ui-tab ui-tab-active"
                        : "ui-tab"
                    }
                    aria-pressed={
                      sortBy === option.field
                    }
                    onClick={() =>
                      handleSort(
                        option.field
                      )
                    }
                  >
                    {option.label}

                    {sortBy ===
                      option.field &&
                      (order === "asc"
                        ? " ↑"
                        : " ↓")}
                  </button>
                )
              )}
            </div>

            {/* RESET */}

            {isFiltered && (
              <button
                className="ui-clear"
                onClick={clearFilters}
              >
                Clear filters
              </button>
            )}
          </div>

          {/* COUNT */}

          <div className="ui-count">
            {loading
              ? "Loading stores…"
              : `${stores.length} ${
                  stores.length === 1
                    ? "store"
                    : "stores"
                }`}
          </div>
        </section>

        {/* ================= STORE CONTENT ================= */}

        {loading ? (
          <div
            className="ui-store-grid"
            aria-hidden="true"
          >
            {[...Array(6)].map(
              (_, index) => (
                <div
                  key={index}
                  className="ui-skeleton-bar ui-skeleton-card"
                />
              )
            )}
          </div>
        ) : stores.length === 0 ? (
          /* ================= EMPTY ================= */

          <div className="ui-card">
            <div className="ui-empty">

              <div className="ui-empty-icon">
                <Icon>
                  <path d="M3.5 9.5 5 4h14l1.5 5.5" />
                  <path d="M4.5 9.5V20h15V9.5" />
                  <path d="M10 20v-5h4v5" />
                </Icon>
              </div>

              <h3>
                No stores found
              </h3>

              <p>
                {isFiltered
                  ? "Nothing matches your search."
                  : "Add the first store to start collecting ratings."}
              </p>

              {isFiltered ? (
                <button
                  className="ui-btn"
                  onClick={clearFilters}
                >
                  Clear filters
                </button>
              ) : (
                <button
                  className="ui-btn ui-btn-primary"
                  onClick={openModal}
                >
                  Add store
                </button>
              )}
            </div>
          </div>
        ) : (
          /* ================= STORES ================= */

          <section className="ui-store-grid">
            {stores.map((store) => (
              <article
                className="ui-store-card"
                key={store.id}
              >
                <div className="ui-store-top">

                  <div className="ui-avatar ui-avatar-owner">
                    {store.name
                      ?.charAt(0)
                      ?.toUpperCase() || "S"}
                  </div>

                  <button
                    className="ui-view"
                    onClick={() =>
                      navigate(
                        `/admin/stores/${store.id}`
                      )
                    }
                  >
                    View
                  </button>
                </div>

                <div className="ui-store-body">

                  <h3>{store.name}</h3>

                  <p className="ui-store-email">
                    {store.email}
                  </p>

                  <p className="ui-store-address">
                    {store.address}
                  </p>
                </div>

                <div className="ui-store-foot">

                  {/* RATING */}

                  <div>
                    <span>Rating</span>

                    <strong className="ui-score">
                      ★{" "}
                      {Number(
                        store.averageRating || 0
                      ).toFixed(1)}
                    </strong>
                  </div>

                  {/* RATING COUNT */}

                  <div>
                    <span>Ratings</span>

                    <strong>
                      {store._count?.ratings ??
                        store.ratingsCount ??
                        store.totalRatings ??
                        0}
                    </strong>
                  </div>

                  {/* OWNER */}

                  <div>
                    <span>Owner</span>

                    <strong>
                      {store.owner?.name ||
                        "Unassigned"}
                    </strong>
                  </div>

                </div>
              </article>
            ))}
          </section>
        )}

        {/* ================= ADD STORE MODAL ================= */}

        {showModal && (
          <div
            className="ui-overlay"
            onClick={closeModal}
          >
            <div
              className="ui-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="store-modal-title"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              {/* MODAL HEADER */}

              <div className="ui-modal-head">

                <div>
                  <h2 id="store-modal-title">
                    Add store
                  </h2>

                  <p>
                    Register a new store
                    and optionally assign
                    an owner.
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
                onSubmit={handleCreateStore}
              >

                {/* NAME */}

                <div className="ui-field">

                  <label htmlFor="store-name">
                    Store name
                  </label>

                  <input
                    id="store-name"
                    type="text"
                    name="name"
                    required
                    autoFocus
                    minLength={20}
                    maxLength={60}
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Enter store name"
                    disabled={formLoading}
                  />

                  <small>
                    Between 20 and 60
                    characters.
                  </small>
                </div>

                {/* EMAIL */}

                <div className="ui-field">

                  <label htmlFor="store-email">
                    Store email
                  </label>

                  <input
                    id="store-email"
                    type="email"
                    name="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder="store@example.com"
                    disabled={formLoading}
                  />
                </div>

                {/* ADDRESS */}

                <div className="ui-field">

                  <label htmlFor="store-address">
                    Address
                  </label>

                  <textarea
                    id="store-address"
                    name="address"
                    required
                    rows="3"
                    maxLength={400}
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Enter store address"
                    disabled={formLoading}
                  />

                  <small>
                    {form.address.length}/400
                    characters.
                  </small>
                </div>

                {/* OWNER */}

                <div className="ui-field">

                  <label htmlFor="store-owner-select">
                    Store owner
                  </label>

                  <select
                    id="store-owner-select"
                    name="ownerId"
                    value={form.ownerId}
                    onChange={handleChange}
                    disabled={formLoading}
                  >
                    <option value="">
                      No owner assigned
                    </option>

                    {owners.map(
                      (owner) => (
                        <option
                          key={owner.id}
                          value={owner.id}
                        >
                          {owner.name} —{" "}
                          {owner.email}
                        </option>
                      )
                    )}
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
                      : "Create store"}
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

export default AdminStores;