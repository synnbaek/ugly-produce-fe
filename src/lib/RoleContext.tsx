import React, { createContext, useContext, useState } from 'react';
import { store } from '@/lib/api';

type Role = 'consumer' | 'farmer';

interface RoleContextValue {
  role: Role;
  setRole: (role: Role) => void;
}

const RoleContext = createContext<RoleContextValue>({
  role: 'consumer',
  setRole: () => {}
});

export const useRole = () => useContext(RoleContext);

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<Role>(store.role);

  const setRole = (newRole: Role) => {
    store.role = newRole;
    setRoleState(newRole);
  };

  return (
    <RoleContext.Provider value={{ role, setRole }}>
      {children}
    </RoleContext.Provider>
  );
};
