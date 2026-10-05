import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import AdminLayout from "../../components/AdminLayout";

const toForm = (s) => ({
  name: s?.name || "",
  email: s?.email || "",
  address: s?.address || "",
  ownerId: s?.owner?.id ? String(s.owner.id) : "",
});

const AdminStoreDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [store, setStore] = useState(null);
  const [owners, setOwners] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [editForm, setEditForm] = useState(toForm(null));

  useEffect(() => {
    fetchStore();
    fetchOwners();
  }, [id]);

  // silent = refresh data without showing the full-page spinner
  const fetchStore = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError("");

      const response = await api.get(`/admin/stores/${id}`);
      const data = response.data?.data || response.data;
      const storeData = data?.store || data;

      setStore(storeData);
      setEditForm(toForm(storeData));
    } catch (err) {
      console.error("Failed to load store:", err);
      setError(err.response?.data?.message || "Unable to load store details.");
    } finally {
      setLoading(false);
    }
  };

  const fetchOwners = async () => {
    try {
      const response = await api.get("/admin/users", {
        params: { role: "OWNER" },
      });

      const data = response.data?.data || response.data;
      setOwners(Array.isArray(data) ? data : data?.users || []);
    } catch (err) {
      console.error("Failed to load owners:", err);
    }
  };

  const startEditing = () => {
    setFormError("");
    setEditForm(toForm(store));
    setIsEditing(true);
  };

  const cancelEditing = () => {
    if (saving) return;
    setFormError("");
    setEditForm(toForm(store));
    setIsEditing(false);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
    setFormError("");
  };

  const validateForm = () => {
    const name = editForm.name.trim();
    const email = editForm.email.trim();
    const address = editForm.address.trim();

    if (!name || !email || !address) {
      return "Store name, email and address are required.";
    }
    if (name.length < 20 || name.length > 60) {
      return "Store name must be between 20 and 60 characters.";
    }
    if (address.length > 400) {
      return "Address must not exceed 400 characters.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Please enter a valid email address.";
    }
    return "";
  };

  const handleUpdateStore = async (e) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      setSaving(true);
      setFormError("");

      await api.put(`/admin/stores/${id}`, {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        address: editForm.address.trim(),
        ownerId: editForm.ownerId ? Number(editForm.ownerId) : null,
      });

      setIsEditing(false);
      await fetchStore(true);
    } catch (err) {
      console.error("Failed to update store:", err);
      setFormError(
        err.response?.data?.message ||
          "Failed to update store. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  /* Loading / error / not found */

  if (loading) {
    return (
      <AdminLayout>
        <div className="ui-state">
          <div className="ui-spinner" />
          <p>Loading store details…</p>
        </div>
      </AdminLayout>
    );
  }

  if (error || !store) {
    return (
      <AdminLayout>
        <div className="ui-state">
          <h2>{error ? "Something went wrong" : "Store not found"}</h2>
          <p>{error || "This store doesn't exist or was removed."}</p>
          <button className="ui-btn" onClick={() => navigate("/admin/stores")}>
            ← Back to stores
          </button>
        </div>
      </AdminLayout>
    );
  }

  const shown = isEditing ? editForm : store;
  const averageRating = Number(store.averageRating || 0);
  const ratingsCount =
    store._count?.ratings ?? store.ratingsCount ?? store.ratings?.length ?? 0;

  return (
    <AdminLayout>
      <form className="ui-page" onSubmit={handleUpdateStore} noValidate>
        {/* Top bar */}
        <div className="ui-topbar">
          <button
            type="button"
            className="ui-back"
            onClick={() => navigate("/admin/stores")}
          >
            ← Back to stores
          </button>

          {!isEditing && (
            <button
              type="button"
              className="ui-btn ui-btn-primary"
              onClick={startEditing}
            >
              Edit store
            </button>
          )}
        </div>

        {/* Store header (shows a live preview while editing) */}
        <section className="ui-card ui-profile">
          <div className="ui-profile-icon ui-profile-icon-owner">
            {shown.name?.charAt(0)?.toUpperCase() || "S"}
          </div>

          <div className="ui-profile-main">
            <div className="ui-profile-title">
              <h1>{shown.name || "Unnamed store"}</h1>
            </div>

            <p className="ui-profile-sub">{shown.email}</p>
            <span className="ui-profile-id">Store ID #{store.id}</span>
          </div>
        </section>

        <div className="ui-detail-grid">
          {/* Store information */}
          <section className="ui-card ui-panel">
            <div className="ui-panel-head">
              <h2>Store information</h2>
              <p>
                {isEditing
                  ? "Edit the details below, then save your changes."
                  : "Basic details about this store."}
              </p>
            </div>

            <dl>
              <div className={`ui-def-row ${isEditing ? "ui-def-edit" : ""}`}>
                <dt>Store name</dt>
                <dd>
                  {isEditing ? (
                    <>
                      <input
                        className="ui-input"
                        type="text"
                        name="name"
                        aria-label="Store name"
                        value={editForm.name}
                        onChange={handleEditChange}
                        maxLength={60}
                      />
                      <small className="ui-hint">
                        {editForm.name.length}/60 · minimum 20 characters
                      </small>
                    </>
                  ) : (
                    store.name
                  )}
                </dd>
              </div>

              <div className={`ui-def-row ${isEditing ? "ui-def-edit" : ""}`}>
                <dt>Email</dt>
                <dd>
                  {isEditing ? (
                    <input
                      className="ui-input"
                      type="email"
                      name="email"
                      aria-label="Email"
                      value={editForm.email}
                      onChange={handleEditChange}
                    />
                  ) : (
                    store.email
                  )}
                </dd>
              </div>

              <div className={`ui-def-row ${isEditing ? "ui-def-edit" : ""}`}>
                <dt>Address</dt>
                <dd>
                  {isEditing ? (
                    <>
                      <textarea
                        className="ui-input"
                        name="address"
                        aria-label="Address"
                        rows={4}
                        maxLength={400}
                        value={editForm.address}
                        onChange={handleEditChange}
                      />
                      <small className="ui-hint">
                        {editForm.address.length}/400
                      </small>
                    </>
                  ) : (
                    store.address
                  )}
                </dd>
              </div>

              <div className="ui-def-row">
                <dt>Created</dt>
                <dd>
                  {store.createdAt
                    ? new Date(store.createdAt).toLocaleDateString()
                    : "—"}
                </dd>
              </div>

              <div className="ui-def-row">
                <dt>Status</dt>
                <dd className="ui-status">Active</dd>
              </div>
            </dl>
          </section>

          {/* Rating overview */}
          <section className="ui-card ui-panel">
            <div className="ui-panel-head">
              <h2>Rating overview</h2>
              <p>What customers think of this store.</p>
            </div>

            <div className="ui-rating-main">
              <div className="ui-big">{averageRating.toFixed(1)}</div>

              <div
                className="ui-stars"
                role="img"
                aria-label={`${averageRating.toFixed(1)} out of 5 stars`}
              >
                {[0, 1, 2, 3, 4].map((index) => (
                  <span
                    key={index}
                    className={
                      index < Math.round(averageRating) ? "ui-star-on" : ""
                    }
                  >
                    ★
                  </span>
                ))}
              </div>

              <p>
                Based on {ratingsCount} {ratingsCount === 1 ? "rating" : "ratings"}
              </p>
            </div>
          </section>
        </div>

        {/* Owner */}
        <section className="ui-card ui-panel" style={{ marginBottom: 18 }}>
          <div className="ui-panel-head">
            <h2>Store owner</h2>
            <p>
              {isEditing
                ? "Assign or change the owner of this store."
                : "The person who manages this store."}
            </p>
          </div>

          {isEditing ? (
            <div>
              <div className="ui-field" style={{ marginBottom: 0 }}>
                <label htmlFor="store-owner">Assigned owner</label>
                <select
                  id="store-owner"
                  name="ownerId"
                  value={editForm.ownerId}
                  onChange={handleEditChange}
                >
                  <option value="">No owner assigned</option>
                  {owners.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.name} — {owner.email}
                    </option>
                  ))}
                </select>
                <small>
                  Only users with the Store owner role can be assigned.
                </small>
              </div>
            </div>
          ) : store.owner ? (
            <div className="ui-person">
              <div className="ui-avatar ui-avatar-owner">
                {store.owner.name?.charAt(0)?.toUpperCase() || "?"}
              </div>

              <div>
                <strong>{store.owner.name}</strong>
                <span>{store.owner.email}</span>
              </div>

              <span className="ui-role ui-role-owner">Store owner</span>
            </div>
          ) : (
            <div className="ui-warn">
              <div>
                <strong>No owner assigned</strong>
                <span>Edit this store to assign an owner.</span>
              </div>
            </div>
          )}
        </section>

        {/* Sticky save bar */}
        {isEditing && (
          <div
            className={`ui-savebar ${formError ? "ui-savebar-error" : ""}`}
            role={formError ? "alert" : undefined}
          >
            <div>
              <strong>{formError ? "Can't save yet" : "Unsaved changes"}</strong>
              <span>
                {formError || "Review the store details, then save."}
              </span>
            </div>

            <div className="ui-savebar-actions">
              <button
                type="button"
                className="ui-btn"
                onClick={cancelEditing}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="ui-btn ui-btn-primary"
                disabled={saving}
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        )}
      </form>
    </AdminLayout>
  );
};

export default AdminStoreDetails;