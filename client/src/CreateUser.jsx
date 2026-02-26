// client/src/CreateUser.jsx
import { useState } from 'react';
import axios from 'axios';

function CreateUser({ token, onUserCreated, currentUserRole }) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    age: '',
    education: '',
    department: '',
    position: '',
    ...(currentUserRole === 'superadmin' ? { role: 'participant' } : {})
  });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    // Prepare payload: convert age to null if empty, otherwise to number
    const payload = {
      username: formData.username,
      password: formData.password,
      full_name: formData.full_name,
      age: formData.age === '' ? null : Number(formData.age),
      education: formData.education,
      department: formData.department,
      position: formData.position,
      role: formData.role || 'participant' // if role not present (non-superadmin), default to participant
    };

    try {
      await axios.post('http://127.0.0.1:8000/users/', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('User created successfully!');
      setFormData({
        username: '',
        password: '',
        full_name: '',
        age: '',
        education: '',
        department: '',
        position: '',
        ...(currentUserRole === 'superadmin' ? { role: 'participant' } : {})
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
      <h3 className="text-xl font-bold mb-4">Add New User</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Username *</label>
            <input type="text" name="username" value={formData.username} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password *</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name *</label>
            <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Age</label>
            <input type="number" name="age" value={formData.age} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Education</label>
            <input type="text" name="education" value={formData.education} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Department</label>
            <input type="text" name="department" value={formData.department} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Position</label>
            <input type="text" name="position" value={formData.position} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3" />
          </div>
          {currentUserRole === 'superadmin' && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select name="role" value={formData.role} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3">
                <option value="participant">Participant</option>
                <option value="admin">Admin</option>
                {/* Optionally superadmin can be created only by superadmin, but we'll keep it out unless needed */}
              </select>
            </div>
          )}
        </div>
        <button type="submit" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
          Add User
        </button>
        {message && <p className="mt-2 text-sm text-blue-600">{message}</p>}
      </form>
    </div>
  );
}

export default CreateUser;