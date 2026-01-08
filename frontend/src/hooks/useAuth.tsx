import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

interface User {
  username: string;
}

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  user: User | null;
  mustChangePassword: boolean;
}

type AuthAction =
  | { type: 'LOGIN'; payload: { token: string; user: User; mustChangePassword: boolean } }
  | { type: 'LOGOUT' }
  | { type: 'INIT_FROM_STORAGE'; payload: { token: string | null; user: User | null; mustChangePassword: boolean } };

const initialState: AuthState = {
  isAuthenticated: false,
  token: null,
  user: null,
  mustChangePassword: false,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        isAuthenticated: true,
        token: action.payload.token,
        user: action.payload.user,
        mustChangePassword: action.payload.mustChangePassword,
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        token: null,
        user: null,
        mustChangePassword: false,
      };
    case 'INIT_FROM_STORAGE':
      return {
        ...state,
        isAuthenticated: !!action.payload.token,
        token: action.payload.token,
        user: action.payload.user,
        mustChangePassword: action.payload.mustChangePassword,
      };
    default:
      return state;
  }
}

interface AuthContextType extends AuthState {
  login: (token: string, user: User, mustChangePassword: boolean) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    // Check if we have a token in local storage
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const storedMustChange = localStorage.getItem('mustChangePassword') === 'true';

    const user = storedUser ? JSON.parse(storedUser) : null;

    dispatch({
      type: 'INIT_FROM_STORAGE',
      payload: {
        token: storedToken,
        user,
        mustChangePassword: storedMustChange,
      },
    });
  }, []);

  const login = (token: string, user: User, mustChangePassword: boolean) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('mustChangePassword', mustChangePassword.toString());
    dispatch({
      type: 'LOGIN',
      payload: { token, user, mustChangePassword },
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('mustChangePassword');
    dispatch({ type: 'LOGOUT' });
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
