import {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
} from 'react';
import { useNavigate } from 'react-router-dom';

import useAxios from '#/hooks/utils/useAxios';
import { IAuthData, IUser } from '#/interfaces/IUser';
import { paths } from '#/routes/paths';

interface AuthContextType {
  isAuthenticated: boolean;
  user: IUser | null;
  login: (user: IAuthData) => void;
  logout: () => void;
  refreshToken: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const axios = useAxios();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<IUser | null>(null);

  useEffect(() => {
    refreshToken();
  }, []);

  const login = ({ data }: IAuthData): void => {
    sessionStorage.setItem('accessToken', data?.accessToken);
    setIsAuthenticated(true);
    setUser(data?.user);
  };

  const logout = () => {
    sessionStorage.removeItem('accessToken');
    setIsAuthenticated(false);
    setUser(null);
    navigate(paths.login);
  };

  const refreshToken = async () => {
    const accessToken = sessionStorage.getItem('accessToken');
    if (!accessToken) return logout();

    const options = {
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    };

    // TODO: Validar q el token sea valido no este vencido, este firmado, etc.

    const { data, error } = await axios.post(
      '/auth/sign-in-using-token',
      {},
      options,
    );
    if (error) return logout();

    login(data);
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, login, logout, refreshToken }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
