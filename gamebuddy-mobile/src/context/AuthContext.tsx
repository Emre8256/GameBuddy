import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AuthContextType = {
    isLoading: boolean;
    userToken: string | null;
    setUserToken: (token: string | null) => void;
};

export const AuthContext = createContext<AuthContextType>({
    isLoading: true,
    userToken: null,
    setUserToken: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [userToken, setUserToken] = useState<string | null>(null);

    useEffect(() => {
        const checkToken = async () => {
            try {
                let token = await AsyncStorage.getItem('userToken');
                setUserToken(token);
            } catch (e) {
                // Token fetch error handling
            } finally {
                setIsLoading(false);
            }
        };
        checkToken();
    }, []);

    const contextValue = React.useMemo(() => ({
        isLoading,
        userToken,
        setUserToken
    }), [isLoading, userToken]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};
