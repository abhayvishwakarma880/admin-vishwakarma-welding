import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";
import http from "../apis/http";

const UserDataContext = createContext();

export const UserDataProvider = ({ children }) => {
  const { isLoggedIn } = useAuth();
  const [userData, setUserData] = useState(null);
  const [userLoading, setUserLoading] = useState(false);

  const fetchUserData = useCallback(async () => {
    setUserLoading(true);
    try {
      const { data } = await http.get("/auth/me");
      setUserData(data.user);
    } catch {
      setUserData(null);
    } finally {
      setUserLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) fetchUserData();
    else setUserData(null);
  }, [isLoggedIn, fetchUserData]);

  return (
    <UserDataContext.Provider value={{ userData, userLoading, fetchUserData }}>
      {children}
    </UserDataContext.Provider>
  );
};

export const useUserData = () => useContext(UserDataContext);
