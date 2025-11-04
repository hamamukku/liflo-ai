import React, { createContext, useContext, useState } from 'react';

interface User {
  nickname: string;
}
interface AuthContextType {
  user: User | null;
  login: (nickname: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({ user: null, login: () => {}, logout: () => {} });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = (nickname: string) => setUser({ nickname });
  const logout = () => setUser(null);

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
