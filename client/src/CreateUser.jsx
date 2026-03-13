// client/src/CreateUser.jsx
import { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { api } from './utils/api';

function CreateUser({ onUserCreated }) {
  const { token, isSuperadmin: currentUserRole } = useAuth();
  const [formData, setFormData] = useState({  // ← FIXED: Added '='
    username: '',
    password: '',
    full_name: '',
    age: '',
    education: '',
    department: '',
    position: '',
    role: 'participant' // default role
  });
  const [message, setMessage] = useState('');

  // Determine which roles are allowed based on current user's role
  const allowedRoles = currentUserRole === 'superadmin'
    ? ['participant', 'admin']
    : ['participant'];

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    // Prepare data: convert age to null if empty, otherwise to number
    const payload = {
      ...formData,
      age: formData.age === '' ? null : Number(formData.age)
    };

    try {
      await api.createUser(payload);
      setMessage('User created successfully!');
      setFormData({
        username: '',
        password: '',
        full_name: '',
        age: '',
        education: '',
        department: '',
        position: '',
        role: 'participant'
      });
      if (onUserCreated) onUserCreated();
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setMessage('Error: ' + detail);
      } else if (Array.isArray(detail)) {
        setMessage('Error: ' + detail.map(d => d.msg).join(', '));
      } else {
        setMessage('Error: ' + (err.response?.data?.detail || 'Unknown error'));
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h3 className="text-xl font-bold mb-4">
        {currentUserRole === 'superadmin' ? 'Add New User' : 'Add New Participant'}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Username *</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password *</label>
            <input
              type="password"  // ← RECOMMENDED: Changed from text to password
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name *</label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Gender</label>
            <select
              name="gender"
              value={formData.gender || ''}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
            >
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Age</label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              min="0"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Education</label>
            <input
              type="text"
              name="education"
              value={formData.education}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Department</label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Position</label>
            <input
              type="text"
              name="position"
              value={formData.position}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
            />
          </div>
          {/* Role dropdown – only if multiple roles allowed */}
          {allowedRoles.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3"
              >
                {allowedRoles.map(role => (
                  <option key={role} value={role}>
                    {role === 'participant' ? 'Participant' : 'Admin'}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <button type="submit" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
          {currentUserRole === 'superadmin' ? 'Create User' : 'Add Participant'}
        </button>
        {message && <p className="mt-2 text-sm text-blue-600">{message}</p>}
      </form>
    </div>
  );
}

export default CreateUser;