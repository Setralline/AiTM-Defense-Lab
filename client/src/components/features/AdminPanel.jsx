import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import authService from '../../services/authService';
import Card from '../layout/Card';
import InputGroup from '../ui/InputGroup';
import Button from '../ui/Button';
import Checkbox from '../ui/Checkbox';
import { FaTrash, FaUserShield, FaEnvelope, FaKey, FaArrowLeft, FaLock, FaUsersCog } from 'react-icons/fa';

const AdminPanel = () => {
  const navigate = useNavigate();
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => sessionStorage.getItem('lab_admin_session') === 'active');
  const [adminCreds, setAdminCreds] = useState({ email: '', password: '' });
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', isAdmin: false });

  // Sync session state with directory fetching
  useEffect(() => { 
    if (isAdminLoggedIn) fetchUsers(); 
  }, [isAdminLoggedIn]);

  /**
   * Fetch Active Directory
   * Retrieves all users from the database for administrative management.
   */
  const fetchUsers = async () => {
    try {
      const data = await authService.getAllUsers();
      setUsers(data.users || []);
    } catch (err) { 
      toast.error("Failed to fetch directory."); 
    }
  };

  /**
   * Admin Authentication Sequence
   * Authenticates using laboratory credentials and establishes a session.
   */
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    const tId = toast.loading('Authenticating...');
    try {
      const res = await authService.loginAdmin(adminCreds);
      if (res.success) {
        sessionStorage.setItem('lab_admin_session', 'active');
        setIsAdminLoggedIn(true);
        toast.success('Access Granted.', { id: tId });
      }
    } catch (err) { 
      toast.error('Access Denied.', { id: tId }); 
    }
  };

  /**
   * Account Provisioning
   * Creates new operative or admin accounts with hashed credentials.
   */
  const handleCreateOperative = async (e) => {
    e.preventDefault();
    const tId = toast.loading('Provisioning...');
    try {
      await authService.createUser(newUser);
      toast.success(`${newUser.isAdmin ? 'Admin' : 'Operative'} added.`, { id: tId });
      setNewUser({ name: '', email: '', password: '', isAdmin: false });
      fetchUsers();
    } catch (err) { 
      toast.error('Provisioning failed.', { id: tId }); 
    }
  };

  /**
   * Operative Purge
   * Permanently deletes a user from the database.
   */
  const handleDeleteOperative = async (id) => {
    if (!window.confirm("CRITICAL: Purge data?")) return;
    const tId = toast.loading('Purging...');
    try {
      await authService.deleteUser(id);
      toast.success('Operative purged.', { id: tId });
      fetchUsers();
    } catch (err) { 
      toast.error('Purge failed.', { id: tId }); 
    }
  };

  /**
   * Security Lock
   * Terminates the administrative session.
   */
  const handleLockPanel = () => {
    sessionStorage.removeItem('lab_admin_session');
    setIsAdminLoggedIn(false);
    toast('Terminal Locked.', { icon: '🔒' });
    navigate('/');
  };

  // Login View
  if (!isAdminLoggedIn) return (
    <Card title="ADMIN TERMINAL">
      <form onSubmit={handleAdminLogin}>
        <InputGroup icon={<FaEnvelope />} type="email" placeholder="Email" onChange={(e) => setAdminCreds({...adminCreds, email: e.target.value})} required />
        <InputGroup icon={<FaLock />} type="password" placeholder="Passcode" onChange={(e) => setAdminCreds({...adminCreds, password: e.target.value})} required />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
          <Button type="submit" fullWidth>INITIALIZE</Button>
          <Button variant="secondary" fullWidth onClick={() => navigate('/')}>EXIT</Button>
        </div>
      </form>
    </Card>
  );

  // Dashboard View
  return (
    <div className="admin-panel">
      {/* Toolbar */}
      <div className="admin-toolbar">
        <Button variant="secondary" fullWidth onClick={() => navigate('/')}><FaArrowLeft /> BASE</Button>
        <Button variant="danger" fullWidth onClick={handleLockPanel}>LOCK PANEL</Button>
      </div>

      {/* Provisioning Card */}
      <Card title="PROVISION ACCOUNT">
        <form onSubmit={handleCreateOperative}>
          <InputGroup icon={<FaUsersCog />} placeholder="Name" value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})} required />
          <InputGroup icon={<FaEnvelope />} type="email" placeholder="Email" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} required />
          <InputGroup icon={<FaKey />} type="password" placeholder="Passcode" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} required />
          
          <Checkbox 
            label="Administrative Privileges" 
            checked={newUser.isAdmin} 
            onChange={(e) => setNewUser({...newUser, isAdmin: e.target.checked})} 
          />
          
          <Button type="submit" fullWidth>CREATE</Button>
        </form>
      </Card>

      {/* Directory Card */}
      <Card title="ACTIVE DIRECTORY">
        <div className="user-list">
          {users.map(u => (
            <div key={u.id} className={`user-item ${u.is_admin ? 'user-item--admin' : ''}`}>
              <div className="user-item__info">
                <h4>{u.name} {u.is_admin && <FaUserShield color="#ff4444" size={12} />}</h4>
                <span>{u.email}</span>
              </div>
              <Button onClick={() => handleDeleteOperative(u.id)} variant="danger" style={{ padding: '5px 10px', height: '30px' }}>
                <FaTrash size={12} />
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default AdminPanel;