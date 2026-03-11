'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type UserType = 'Moksh' | 'smit';

interface UserContextType {
    currentUser: UserType;
    setCurrentUser: (user: UserType) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    const [currentUser, setCurrentUser] = useState<UserType>('Moksh');

    useEffect(() => {
        // Load from local storage if exists
        const saved = localStorage.getItem('founder_identity');
        if (saved && (saved === 'Moksh' || saved === 'smit')) {
            setCurrentUser(saved as UserType);
        }
    }, []);

    const handleSetUser = (user: UserType) => {
        setCurrentUser(user);
        localStorage.setItem('founder_identity', user);
    };

    return (
        <UserContext.Provider value={{ currentUser, setCurrentUser: handleSetUser }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
