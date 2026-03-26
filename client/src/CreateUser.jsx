// client/src/CreateUser.jsx
import { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { api } from './utils/api';
import Swal from 'sweetalert2';

function CreateUser({ onUserCreated }) {
  const { token, isSuperadmin: currentUserRole } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    full_name: '',
    gender: '',
    age: '',
    education: '',
    department: '',
    position: '',
    role: 'participant' // default role
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Determine which roles are allowed based on current user's role
  const allowedRoles = currentUserRole === 'superadmin'
    ? ['participant', 'admin']
    : ['participant'];

  const validateForm = () => {
    const newErrors = {};

    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Full name validation
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }

    // Age validation (if provided)
    if (formData.age && (formData.age < 1 || formData.age > 120)) {
      newErrors.age = 'Age must be between 1 and 120';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Scroll to first error
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        document.getElementsByName(firstErrorField)[0]?.focus();
      }
      return;
    }

    setLoading(true);

    // Prepare data: convert age to null if empty, otherwise to number
    const payload = {
      username: formData.username.trim(),
      password: formData.password,
      full_name: formData.full_name.trim(),
      gender: formData.gender || null,
      age: formData.age === '' ? null : Number(formData.age),
      education: formData.education.trim() || null,
      department: formData.department.trim() || null,
      position: formData.position.trim() || null,
      role: formData.role
    };

    try {
      await api.createUser(payload);
      
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: `${formData.role === 'participant' ? 'Participant' : 'User'} created successfully!`,
        timer: 2000,
        showConfirmButton: false
      });

      // Reset form
      setFormData({
        username: '',
        password: '',
        full_name: '',
        gender: '',
        age: '',
        education: '',
        department: '',
        position: '',
        role: 'participant'
      });
      setErrors({});
      
      if (onUserCreated) onUserCreated();
    } catch (err) {
      const detail = err.response?.data?.detail;
      let errorMessage = 'Failed to create user';
      
      if (typeof detail === 'string') {
        errorMessage = detail;
      } else if (Array.isArray(detail)) {
        errorMessage = detail.map(d => d.msg).join(', ');
      }

      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (fieldName) => `
    mt-1 block w-full border rounded-md shadow-sm py-2 px-3 
    focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
    transition-colors duration-200
    ${errors[fieldName] ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}
  `;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900">
          {currentUserRole === 'superadmin' ? 'Add New User' : 'Add New Participant'}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Fill in the information below. Fields marked with * are required.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Required Fields Section */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide border-b pb-2">
            Required Information
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={inputClass('username')}
                placeholder="e.g., john.doe"
                autoComplete="off"
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={inputClass('password')}
                placeholder="Minimum 6 characters"
                autoComplete="new-password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className={inputClass('full_name')}
                placeholder="e.g., John Doe"
              />
              {errors.full_name && (
                <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>
              )}
            </div>
          </div>
        </div>

        {/* Optional Fields Section */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide border-b pb-2">
            Optional Information
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Gender</label>
              <select
                name="gender"
                value={formData.gender || ''}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select gender</option>
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
                min="1"
                max="120"
                placeholder="e.g., 25"
                className={inputClass('age')}
              />
              {errors.age && (
                <p className="mt-1 text-sm text-red-600">{errors.age}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Education</label>
              <input
                type="text"
                name="education"
                value={formData.education}
                onChange={handleChange}
                placeholder="e.g., Bachelor's Degree"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Department</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="e.g., Human Resources"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Position</label>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleChange}
                placeholder="e.g., HR Manager"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4 border-t">
          <button
            type="submit"
            disabled={loading}
            className={`
              bg-gradient-to-r from-green-500 to-green-600 
              hover:from-green-600 hover:to-green-700 
              text-white font-semibold py-2.5 px-6 rounded-lg 
              shadow-md hover:shadow-lg 
              transform transition-all duration-200 
              disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
              flex items-center gap-2
            `}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {currentUserRole === 'superadmin' ? 'Create User' : 'Add Participant'}
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setFormData({
                username: '',
                password: '',
                full_name: '',
                gender: '',
                age: '',
                education: '',
                department: '',
                position: '',
                role: 'participant'
              });
              setErrors({});
            }}
            className="text-gray-600 hover:text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Clear Form
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateUser;