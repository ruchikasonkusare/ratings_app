import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import AdminLayout from "../../components/AdminLayout";

const roleLabel = { USER: "User", OWNER: "Store owner", ADMIN: "Admin" };

const toForm = (u) => ({
  name: u?.name || "",
  email: u?.email || "",
  address: u?.address || "",
  role: u?.role || "USER",
});

const AdminUserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [editForm, setEditForm] = useState(toForm(null));

  useEffect(() => {
    fetchUser();
  }, [id]);

  // silent = refresh data without showing the full-page spinner
  const fetchUser = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      setError("");

      const response = await api.get(`/admin/users/${id}`);
      const data = response.data.data || response.data;
      const userData = data.user || data;

      setUser(userData);
      setEditForm(toForm(userData));
    } catch (err) {
      console.error("Failed to load user:", err);
      setError(err.response?.data?.message || "Unable to load user details.");
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  };

  const startEditing = () => {
    setFormError("");
    setEditForm(toForm(user));
    setIsEditing(true);
  };

  const cancelEditing = () => {
    if (saving) return;
    setFormError("");
    setEditForm(toForm(user));
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
      return "Please fill in all required fields.";
    }
    if (name.length < 20 || name.length > 60) {
      return "Name must be between 20 and 60 characters.";
    }
    if (address.length > 400) {
      return "Address must not exceed 400 characters.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "Please enter a valid email address.";
    }
    return "";
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      setSaving(true);
      setFormError("");

      await api.put(`/admin/users/${id}`, {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        address: editForm.address.trim(),
        role: editForm.role,
      });

      setIsEditing(false);
      await fetchUser(true);
    } catch (err) {
      console.error("Failed to update user:", err);
      setFormError(
        err.response?.data?.message || "Failed to update user. Please try again."
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
          <p>Loading user details…</p>
        </div>
      </AdminLayout>
    );
  }

  if (error || !user) {
    return (
      <AdminLayout>
        <div className="ui-state">
          <h2>{error ? "Something went wrong" : "User not found"}</h2>
          <p>{error || "This user doesn't exist or was removed."}</p>
          <button className="ui-btn" onClick={() => navigate("/admin/users")}>
            ← Back to users
          </button>
        </div>
      </AdminLayout>
    );
  }

  const shown = isEditing ? editForm : user;
  const roleKey = (shown.role || "USER").toLowerCase();
  const ratingsGiven = user._count?.ratings ?? user.ratingsCount ?? 0;
  const ownedStores = user.role === "OWNER" ? user.stores || [] : [];

  return (
    <AdminLayout>
      <form className="ui-page" onSubmit={handleUpdateUser} noValidate>
        {/* Top bar */}
        <div className="ui-topbar">
          <button
            type="button"
            className="ui-back"
            onClick={() => navigate("/admin/users")}
          >
            ← Back to users
          </button>

          {!isEditing && (
            <button
              type="button"
              className="ui-btn ui-btn-primary"
              onClick={startEditing}
            >
              Edit user
            </button>
          )}
        </div>

        {/* Profile header (shows a live preview while editing) */}
        <section className="ui-card ui-profile">
          <div className={`ui-profile-icon ui-profile-icon-${roleKey}`}>
            {getInitials(shown.name)}
          </div>

          <div className="ui-profile-main">
            <div className="ui-profile-title">
              <h1>{shown.name || "Unnamed user"}</h1>
              <span className={`ui-role ui-role-${roleKey}`}>
                {roleLabel[shown.role] || shown.role}
              </span>
            </div>

            <p className="ui-profile-sub">{shown.email}</p>
            <span className="ui-profile-id">User ID #{user.id}</span>
          </div>
        </section>

        <div className="ui-detail-grid">
          {/* Personal information */}
          <section className="ui-card ui-panel">
            <div className="ui-panel-head">
              <h2>Personal information</h2>
              <p>
                {isEditing
                  ? "Edit the details below, then save your changes."
                  : "Basic account details."}
              </p>
            </div>

            <dl>
              <div className={`ui-def-row ${isEditing ? "ui-def-edit" : ""}`}>
                <dt>Full name</dt>
                <dd>
                  {isEditing ? (
                    <>
                      <input
                        className="ui-input"
                        type="text"
                        name="name"
                        aria-label="Full name"
                        value={editForm.name}
                        onChange={handleEditChange}
                        maxLength={60}
                      />
                      <small className="ui-hint">
                        {editForm.name.length}/60 · minimum 20 characters
                      </small>
                    </>
                  ) : (
                    user.name
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
                    user.email
                  )}
                </dd>
              </div>

              <div className={`ui-def-row ${isEditing ? "ui-def-edit" : ""}`}>
                <dt>Role</dt>
                <dd>
                  {isEditing ? (
                    <select
                      className="ui-input"
                      name="role"
                      aria-label="Role"
                      value={editForm.role}
                      onChange={handleEditChange}
                    >
                      <option value="USER">User</option>
                      <option value="OWNER">Store owner</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  ) : (
                    roleLabel[user.role] || user.role
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
                        rows={3}
                        maxLength={400}
                        value={editForm.address}
                        onChange={handleEditChange}
                      />
                      <small className="ui-hint">
                        {editForm.address.length}/400
                      </small>
                    </>
                  ) : (
                    user.address || "Not provided"
                  )}
                </dd>
              </div>
            </dl>
          </section>

          {/* Activity + account */}
          <section className="ui-card ui-panel">
            <div className="ui-panel-head">
              <h2>Activity</h2>
              <p>Summary of this account.</p>
            </div>

            <dl>
              <div className="ui-def-row">
                <dt>Ratings given</dt>
                <dd>{ratingsGiven}</dd>
              </div>

              <div className="ui-def-row">
                <dt>Status</dt>
                <dd className="ui-status">Active</dd>
              </div>

              <div className="ui-def-row">
                <dt>Created</dt>
                <dd>
                  {user.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : "—"}
                </dd>
              </div>

              <div className="ui-def-row">
                <dt>User ID</dt>
                <dd>#{user.id}</dd>
              </div>
            </dl>
          </section>
        </div>

        {/* Store ratings for owners */}
        {ownedStores.length > 0 && (
          <section className="ui-card ui-panel" style={{ marginBottom: 18 }}>
            <div className="ui-panel-head">
              <h2>Store ratings</h2>
              <p>Stores owned by this user and how they are rated.</p>
            </div>

            <div className="ui-rows">
              {ownedStores.map((store) => (
                <div key={store.id} className="ui-row">
                  <div>
                    <strong>{store.name}</strong>
                    <span>
                      {store.ratingsCount ?? 0}{" "}
                      {store.ratingsCount === 1 ? "rating" : "ratings"}
                    </span>
                  </div>

                  <span className="ui-row-score">
                    ★ {Number(store.averageRating || 0).toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Sticky save bar */}
        {isEditing && (
          <div
            className={`ui-savebar ${formError ? "ui-savebar-error" : ""}`}
            role={formError ? "alert" : undefined}
          >
            <div>
              <strong>{formError ? "Can't save yet" : "Unsaved changes"}</strong>
              <span>
                {formError || "Review your changes, then save."}
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

export default AdminUserDetails;