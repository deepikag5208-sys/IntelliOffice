import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('office_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('office_token');
      if (token) {
        try {
          const res = await API.get('/auth/me');
          const emp = res.data.employee;
          const userData = {
            id: res.data.id,
            email: res.data.email,
            role: res.data.role,
            employee_id: emp ? emp.id : null,
            employee_code: emp ? emp.employee_code : null,
            name: emp ? `${emp.first_name} ${emp.last_name}` : res.data.email,
            designation: emp ? emp.designation : 'System User',
            department: emp ? emp.department_name : 'N/A',
            avatar: emp ? emp.avatar : null
          };
          setUser(userData);
          localStorage.setItem('office_user', JSON.stringify(userData));
        } catch (err) {
          console.error("Session restoration error:", err);
          logout();
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const login = async (email, password) => {
    const res = await API.post('/auth/login', { email, password });
    const { access_token, user: userData } = res.data;
    localStorage.setItem('office_token', access_token);
    localStorage.setItem('office_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('office_token');
    localStorage.removeItem('office_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
