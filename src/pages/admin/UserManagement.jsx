import { useState, useEffect } from 'react';
import './UserManagement.css';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        phone: '',
        address: '',
        role: 'customer'
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/admin/users', {
                credentials: 'include'
            });
            const data = await response.json();
            setUsers(data);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const url = editingUser
                ? `/api/admin/users/${editingUser.id}`
                : '/api/admin/users';

            const method = editingUser ? 'PUT' : 'POST';

            // Don't send password if editing and password is empty
            const body = { ...formData };
            if (editingUser && !body.password) {
                delete body.password;
            }

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(body)
            });

            if (response.ok) {
                fetchUsers();
                resetForm();
                alert(editingUser ? 'User updated successfully!' : 'User created successfully!');
            } else {
                const error = await response.json();
                alert(error.error || 'Operation failed');
            }
        } catch (error) {
            console.error('Error saving user:', error);
            alert('Error saving user');
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setFormData({
            email: user.email,
            password: '', // Don't populate password
            name: user.name,
            phone: user.phone || '',
            address: user.address || '',
            role: user.role || 'customer'
        });
        setShowForm(true);
    };

    const handleDelete = async (userId, userName) => {
        if (!confirm(`Are you sure you want to delete user "${userName}"?`)) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                fetchUsers();
                alert('User deleted successfully!');
            } else {
                const error = await response.json();
                alert(error.error || 'Delete failed');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Error deleting user');
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ role: newRole })
            });

            if (response.ok) {
                fetchUsers();
            } else {
                const error = await response.json();
                alert(error.error || 'Role update failed');
            }
        } catch (error) {
            console.error('Error updating role:', error);
            alert('Error updating role');
        }
    };

    const resetForm = () => {
        setFormData({
            email: '',
            password: '',
            name: '',
            phone: '',
            address: '',
            role: 'customer'
        });
        setShowForm(false);
        setEditingUser(null);
    };

    const getRoleBadgeClass = (role) => {
        switch (role) {
            case 'admin': return 'badge-error';
            case 'kiosk': return 'badge-warning';
            default: return 'badge-info';
        }
    };

    return (
        <div className="user-management">
            <div className="container">
                <div className="page-header">
                    <h1>User Management</h1>
                    <button
                        onClick={() => {
                            if (showForm && !editingUser) {
                                resetForm();
                            } else {
                                setEditingUser(null);
                                setShowForm(!showForm);
                            }
                        }}
                        className="btn btn-primary"
                    >
                        {showForm ? 'Cancel' : '+ Add User'}
                    </button>
                </div>

                {showForm && (
                    <div className="user-form card">
                        <h2>{editingUser ? 'Edit User' : 'Create New User'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="form-input"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="form-input"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">
                                        Password {editingUser && '(leave blank to keep current)'}
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="form-input"
                                        required={!editingUser}
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Phone</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="form-input"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Role</label>
                                    <select
                                        value={formData.role}
                                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        className="form-select"
                                        required
                                    >
                                        <option value="customer">Customer</option>
                                        <option value="kiosk">Kiosk</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Address</label>
                                <textarea
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="form-textarea"
                                    rows="2"
                                    required
                                />
                            </div>

                            <div className="form-actions">
                                <button type="button" onClick={resetForm} className="btn btn-outline">
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingUser ? 'Update User' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="users-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Role</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id}>
                                    <td>{user.name}</td>
                                    <td>{user.email}</td>
                                    <td>{user.phone}</td>
                                    <td>
                                        <select
                                            value={user.role || 'customer'}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                            className={`role-select ${getRoleBadgeClass(user.role)}`}
                                        >
                                            <option value="customer">Customer</option>
                                            <option value="kiosk">Kiosk</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </td>
                                    <td>
                                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button
                                                onClick={() => handleEdit(user)}
                                                className="btn btn-sm btn-ghost"
                                                title="Edit user"
                                            >
                                                ✏️ Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user.id, user.name)}
                                                className="btn btn-sm btn-ghost"
                                                title="Delete user"
                                            >
                                                🗑️ Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;
