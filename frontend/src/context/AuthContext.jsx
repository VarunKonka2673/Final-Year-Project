import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE } from '../config';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile 
} from '../firebase';

export const DEFAULT_ADMIN_EMAIL = 'varunkonka2673@gmail.com';
export const DEFAULT_ADMIN_PASSWORD = 'Admin@123';
export const ADMIN_EMAIL = DEFAULT_ADMIN_EMAIL;

const AuthContext = createContext({
  currentUser: null,
  isAdmin: false,
  role: 'guest',
  loading: true,
  adminsList: [],
  loginWithGoogle: async () => {},
  loginWithEmail: async () => {},
  registerWithEmail: async () => {},
  logout: async () => {},
  fetchAdmins: async () => {},
  addAdmin: async () => {},
  removeAdmin: async () => {}
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('sg_auth_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [adminsList, setAdminsList] = useState([]);
  const [loading, setLoading] = useState(false);

  // Check if current user has Admin role
  const isAdmin = Boolean(
    currentUser?.role === 'admin' ||
    (currentUser?.email && (
      currentUser.email.trim().toLowerCase() === DEFAULT_ADMIN_EMAIL.toLowerCase() ||
      adminsList.some(a => a.email?.toLowerCase() === currentUser.email.trim().toLowerCase())
    ))
  );

  const role = currentUser ? (isAdmin ? 'admin' : 'user') : 'guest';

  // Load admins list from backend
  const fetchAdmins = async () => {
    if (!currentUser?.email) return;
    try {
      const res = await fetch(`${API_BASE}/api/auth/admins?user_email=${encodeURIComponent(currentUser.email)}`);
      if (res.ok) {
        const data = await res.json();
        setAdminsList(data.admins || []);
      }
    } catch (err) {
      console.warn("Could not fetch admin roster:", err);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAdmins();
    }
  }, [currentUser?.email, isAdmin]);

  // 1. Login with Email & Password
  const loginWithEmail = async (email, password) => {
    const cleanEmail = email.trim().toLowerCase();

    // Check Default Admin credentials first
    if (cleanEmail === DEFAULT_ADMIN_EMAIL.toLowerCase() && password === DEFAULT_ADMIN_PASSWORD) {
      const adminUser = {
        uid: 'admin_default_varun',
        email: DEFAULT_ADMIN_EMAIL,
        displayName: 'Varun Konka (Admin)',
        role: 'admin'
      };
      setCurrentUser(adminUser);
      localStorage.setItem('sg_auth_user', JSON.stringify(adminUser));
      return { success: true, user: adminUser };
    }

    // Attempt backend relational database authentication
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password: password })
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        localStorage.setItem('sg_auth_user', JSON.stringify(data.user));
        return { success: true, user: data.user };
      } else {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || 'Invalid email or password.');
      }
    } catch (apiErr) {
      // If backend network error, attempt Firebase Auth fallback
      try {
        const res = await signInWithEmailAndPassword(auth, cleanEmail, password);
        const user = res.user;
        const isMaster = cleanEmail === DEFAULT_ADMIN_EMAIL.toLowerCase();
        const userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email.split('@')[0],
          role: isMaster ? 'admin' : 'user'
        };
        setCurrentUser(userData);
        localStorage.setItem('sg_auth_user', JSON.stringify(userData));
        return { success: true, user: userData };
      } catch (fbErr) {
        throw new Error(apiErr.message || fbErr.message || 'Authentication failed.');
      }
    }
  };

  // 2. Register Normal User with Email & Password (Only creates role 'user')
  const registerWithEmail = async (email, password, displayName = '') => {
    const cleanEmail = email.trim().toLowerCase();

    // Block attempting to register with default admin email
    if (cleanEmail === DEFAULT_ADMIN_EMAIL.toLowerCase()) {
      throw new Error(`The default administrator account already exists. Please sign in with the Admin password.`);
    }

    // Call backend relational registration (strictly enforces role: 'user')
    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          password: password,
          display_name: displayName || cleanEmail.split('@')[0]
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || 'Registration failed.');
      }

      const data = await res.json();

      // Also register in Firebase Auth if available
      try {
        const fbRes = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        if (displayName) {
          await updateProfile(fbRes.user, { displayName });
        }
      } catch (fbErr) {
        console.warn("Firebase Auth registration sync notice:", fbErr.message);
      }

      setCurrentUser(data.user);
      localStorage.setItem('sg_auth_user', JSON.stringify(data.user));
      return { success: true, user: data.user };
    } catch (err) {
      throw err;
    }
  };

  // 3. Login with Google (Checks admin table for role assignment)
  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const cleanEmail = user.email.trim().toLowerCase();

      // Sync with backend relational database
      let finalRole = (cleanEmail === DEFAULT_ADMIN_EMAIL.toLowerCase()) ? 'admin' : 'user';

      try {
        const res = await fetch(`${API_BASE}/api/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cleanEmail,
            displayName: user.displayName || cleanEmail.split('@')[0],
            uid: user.uid,
            photoURL: user.photoURL || null
          })
        });
        if (res.ok) {
          const data = await res.json();
          finalRole = data.user.role;
        }
      } catch (err) {
        console.warn("Backend Google auth sync fallback:", err);
      }

      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email.split('@')[0],
        photoURL: user.photoURL || null,
        role: finalRole
      };

      setCurrentUser(userData);
      localStorage.setItem('sg_auth_user', JSON.stringify(userData));
      return { success: true, user: userData };
    } catch (error) {
      console.error('Google Sign-In error:', error);
      throw error;
    }
  };

  // 4. Admin Action: Add Another Admin
  const addAdmin = async (newAdminEmail) => {
    if (!isAdmin) {
      throw new Error("Only an existing Administrator can appoint other Admins.");
    }
    const cleanEmail = newAdminEmail.trim().toLowerCase();
    const res = await fetch(`${API_BASE}/api/auth/admins/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        admin_email: cleanEmail,
        requestor_email: currentUser.email
      })
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.detail || 'Failed to grant admin privileges.');
    }

    const data = await res.json();
    setAdminsList(data.admins || []);
    return data;
  };

  // 5. Admin Action: Remove An Appointed Admin
  const removeAdmin = async (adminEmailToRemove) => {
    if (!isAdmin) {
      throw new Error("Only an existing Administrator can revoke Admin rights.");
    }
    const cleanEmail = adminEmailToRemove.trim().toLowerCase();
    if (cleanEmail === DEFAULT_ADMIN_EMAIL.toLowerCase()) {
      throw new Error("The default master admin cannot be removed.");
    }

    const res = await fetch(
      `${API_BASE}/api/auth/admins/remove?admin_email=${encodeURIComponent(cleanEmail)}&requestor_email=${encodeURIComponent(currentUser.email)}`, 
      { method: 'DELETE' }
    );

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.detail || 'Failed to revoke admin privileges.');
    }

    const data = await res.json();
    setAdminsList(data.admins || []);
    return data;
  };

  // 6. Sign Out
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('Sign out warning:', err);
    }
    setCurrentUser(null);
    localStorage.removeItem('sg_auth_user');
  };

  const value = {
    currentUser,
    isAdmin,
    role,
    loading,
    adminsList,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    logout,
    fetchAdmins,
    addAdmin,
    removeAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
