import React from 'react';
import { VistaLogin } from '../pages/VistaLogin';

export function PrivateRoute({ token, user, onLoginSuccess, children }) {
  const storedToken = token || localStorage.getItem('token');
  
  if (!storedToken || !user) {
    return <VistaLogin onLoginSuccess={onLoginSuccess} />;
  }

  return children;
}
