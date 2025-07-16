"use client"
import { User } from "lucide-react";
import { createContext, useContext, useEffect, useState } from "react";

interface User {
  id: string;
  name: string;
  avatar: string;
  contestsCreated: number;
  contestsJoined: number;
  currentRank: number;
}

interface UserContextType {
  user: User;
  setUser: (user: User) => void;
}

const defaultUser: User = {
  id: "",
  name: "",
  avatar: "",
  contestsCreated: 0,
  contestsJoined: 0,
  currentRank: 0,
};

const UserContext = createContext<UserContextType>({
  user: defaultUser,
  setUser: () => {},
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User>(defaultUser);

  useEffect(() => {
    const storedId = sessionStorage.getItem("userId");
    const storedName = sessionStorage.getItem("userName");
    const storedAvatar = sessionStorage.getItem("userAvatar");

    console.log("Stored User Data:", {
      id: storedId,
      name: storedName,
      avatar: storedAvatar,
    });

    if (storedId && storedName && storedAvatar) {
      setUser({
        id: storedId,
        name: storedName,
        avatar: storedAvatar,
        contestsCreated: 0,
        contestsJoined: 0,
        currentRank: 0,
      });
    }
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
