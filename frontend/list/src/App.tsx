import React, { FC, createContext, useCallback, useContext, useRef, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import "jwt-decode";
import { jwtDecode } from 'jwt-decode';

type AuthContextType = {
  isSignIn: boolean;
  storedKeys: Array<{ id: string, content: string }>;
  selectedKey: { id: string, content: string };
  accessToken?: string;
  refreshToken?: string;
  signIn: (login: string, password: string, code: string, keyId?: string, keyContent?: string) => void;
}

const AuthContext = createContext<AuthContextType>({} as any);

const LoginPage: FC = () => {
  const authContext = useContext(AuthContext);
  const loginRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const keyRef = useRef<HTMLSelectElement>(null);

  const handleSignIn = useCallback(() => {
    let keyId = keyRef.current?.value === "" ? undefined : keyRef.current?.value;
    let keyContent = undefined;
    if (keyId !== undefined) {
      const storedKey = authContext.storedKeys.find(x => x.id == keyId);
      if (!!storedKey) {
        keyContent = storedKey.content;
      }
    } else {
      keyContent = Math.floor(Math.random() * 100000) + 100000 + "";
    }
    authContext.signIn(
      loginRef.current?.value || "",
      passwordRef.current?.value || "",
      codeRef.current?.value || "",
      keyId,
      keyContent,
    )
  }, [authContext, loginRef, passwordRef, codeRef, keyRef])

  return <div>
    <input ref={loginRef}/>
    <input ref={passwordRef}/>
    <input ref={codeRef}/>
    <select ref={keyRef}>
      <option value="">New key</option>
      {
        authContext.storedKeys.map(key => <option value={key.id}>{key.id}</option>)
      }
    </select>
    <button onClick={handleSignIn}>Login</button>
  </div>
};

const ListPage: FC = () => {
  const authContext = useContext(AuthContext);
  return <div>
    <div>{authContext.selectedKey.id}</div>
    <div>{authContext.selectedKey.content}</div>
  </div>
};

const RouterPage: FC = () => {
  const authContext = useContext(AuthContext);
  return <>{ authContext.isSignIn ? <ListPage/> : <LoginPage/> }</>
};

function App() {
  const [isSignIn, setIsSignIn] = useState(false);
  const [storedKeys, setStoredKeys] = useState([{ id: "8fce9e37-26fa-4c0a-989e-dad175eae42c", content: "key" }]);
  const [selectedKey, setSelectedKey] = useState({ id: "8fce9e37-26fa-4c0a-989e-dad175eae42c", content: "key" });
  const [accessToken, setAccessToken] = useState("");
  const signIn = useCallback(async (login: string, password: string, code: string, keyId?: string, keyContent?: string) => {
    const res = await fetch(
      "http://127.0.0.1/auth/login",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          login,
          password,
          code,
          keyId,
          keyContent,
        }),
      },
    );
    setIsSignIn(true);
    const data = await res.json();
    const accessToken = data.accessToken;
    setAccessToken(accessToken);
    const accessTokenData = jwtDecode<{key: string}>(accessToken);
    let keys = storedKeys;
    if (!!keyContent && !keyId) {
      keys = [...storedKeys, { id: accessTokenData.key, content: keyContent }]
      setStoredKeys(keys);
    }
    setSelectedKey(keys.find(x => x.id === accessTokenData.key) as { id: string, content: string });
  }, [setIsSignIn, storedKeys, setStoredKeys, setAccessToken]);

  return (
    <AuthContext.Provider value={{
      isSignIn,
      storedKeys,
      selectedKey,
      accessToken,
      signIn,
    }}>
      <RouterPage/>
    </AuthContext.Provider>
  );
}

export default App;
