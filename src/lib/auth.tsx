
import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'super_admin' | 'admin' | 'principal' | 'teacher' | 'parent';

interface User {
    id: number;
    email: string;
    name: string;
    role: UserRole;
    school_id?: number | null;
}

interface AuthContextType {
    user: User | null;
    login: (email: string, role: UserRole, name: string, id: number, school_id?: number | null) => void;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedUser = localStorage.getItem('fs_user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    const login = (email: string, role: UserRole, name: string, id: number, school_id?: number | null) => {
        const newUser = { id, email, role, name, school_id: school_id ?? null };
        setUser(newUser);
        localStorage.setItem('fs_user', JSON.stringify(newUser));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('fs_user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
