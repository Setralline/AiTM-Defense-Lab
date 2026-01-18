import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import authService from '../services/authService';

// UI Components
import Card from '../components/layout/Card';
import InputGroup from '../components/ui/InputGroup';
import Button from '../components/ui/Button';
import Checkbox from '../components/ui/Checkbox';
import { FaTrash, FaUserShield, FaEnvelope, FaKey, FaArrowLeft, FaLock, FaUsersCog } from 'react-icons/fa';

/**
 * AdminPanel Component
 * Logic: Manages directory services and account provisioning.
 * Style: Strict BEM implementation.
 */
const AdminPanel = () => {
  const navigate = useNavigate();
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => sessionStorage.getItem('lab_admin_session') === 'active');
  const [adminCreds, setAdminCreds] = useState({ email: '', password: '' });
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', isAdmin: false });

  useEffect(() => {
    if (isAdminLoggedIn) fetchUsers();
  }, [isAdminLoggedIn]);

  const fetchUsers = async () => {
    try {
      const data = await authService.getAllUsers();
      setUsers(data.users || []);
    } catch (err) {
      toast.error("Failed to fetch directory.");
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    const tId = toast.loading('Authenticating...');
    try {
      const res = await authService.loginAdmin(adminCreds);
      if (res.token) {
        sessionStorage.setItem('lab_admin_session', 'active');
        setIsAdminLoggedIn(true);
        toast.success('Admin Access Granted.', { id: tId });
      }
    } catch (err) {
      toast.error('Access Denied: Invalid Admin Credentials.', { id: tId });
    }
  };

  const handleCreateOperative = async (e) => {
    e.preventDefault();
    const tId = toast.loading('Provisioning Account...');
    try {
      await authService.createUser(newUser);
      toast.success(`${newUser.isAdmin ? 'Admin' : 'Operative'} added.`, { id: tId });
      setNewUser({ name: '', email: '', password: '', isAdmin: false });
      fetchUsers();
    } catch (err) {
      toast.error('Provisioning failed.', { id: tId });
    }
  };

  const handleDeleteOperative = async (id) => {
    if (!window.confirm("CRITICAL: Permanently purge this operative's data?")) return;
    const tId = toast.loading('Purging...');
    try {
      await authService.deleteUser(id);
      toast.success('Operative data purged.', { id: tId });
      fetchUsers();
    } catch (err) {
      toast.error('Purge failed.', { id: tId });
    }
  };

  const handleLockPanel = () => {
    sessionStorage.removeItem('lab_admin_session');
    setIsAdminLoggedIn(false);
    toast('Terminal Locked.', { icon: '🔒' });
    navigate('/');
  };

  if (!isAdminLoggedIn) return (
    <Card title="ADMIN TERMINAL" footer="RESTRICTED AREA">
      <form onSubmit={handleAdminLogin} className="form-container">
        <InputGroup icon={<FaEnvelope />} type="email" placeholder="Email" onChange={(e) => setAdminCreds({ ...adminCreds, email: e.target.value })} required />
        <InputGroup icon={<FaLock />} type="password" placeholder="Passcode" onChange={(e) => setAdminCreds({ ...adminCreds, password: e.target.value })} required />
        <div className="form-actions--vertical">
          <Button type="submit" fullWidth variant="primary">INITIALIZE ACCESS</Button>
          <Button variant="secondary" fullWidth onClick={() => navigate('/')}>EXIT TERMINAL</Button>
        </div>
      </form>
    </Card>
  );

  return (
    <div className="admin-panel animate-fade-in">
      <div className="admin-toolbar">
        <Button variant="secondary" onClick={() => navigate('/')}><FaArrowLeft /> BASE</Button>
        <Button variant="danger" onClick={handleLockPanel}><FaLock /> LOCK PANEL</Button>
      </div>

      <div className="admin-grid">
        <Card title="PROVISION ACCOUNT">
          <form onSubmit={handleCreateOperative} className="form-container">
            <InputGroup icon={<FaUsersCog />} placeholder="Full Name" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} required />
            <InputGroup icon={<FaEnvelope />} type="email" placeholder="Email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} required />
            <InputGroup icon={<FaKey />} type="password" placeholder="Passcode" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required />
            <Checkbox label="Administrative Privileges" checked={newUser.isAdmin} onChange={(e) => setNewUser({ ...newUser, isAdmin: e.target.checked })} />
            <Button type="submit" fullWidth variant="primary">CREATE IDENTITY</Button>
          </form>
        </Card>

        <Card title="ACTIVE DIRECTORY">
          <div className="user-list">
            {users.map(u => (
              <div key={u.id} className={`user-item ${u.is_admin ? 'user-item--admin' : ''}`}>
                <div className="user-item__info">
                  <h4 className="user-item__name">
                    {u.name} {u.is_admin && <FaUserShield className="user-item__badge" />}
                  </h4>
                  <span className="user-item__email">{u.email}</span>
                </div>
                <Button onClick={() => handleDeleteOperative(u.id)} variant="danger" className="btn--icon-only">
                  <FaTrash size={12} />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminPanel;