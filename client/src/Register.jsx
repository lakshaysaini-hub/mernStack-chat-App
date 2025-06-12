import { useContext, useState } from "react";
import axios from "axios";
import { UserContext } from "./UserContext";

const Register = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [isLoginOrRegister, setLoginOrRegister] = useState("register");

  const { setUsername: setLoggedInUsername, setId } = useContext(UserContext);

  async function handleSubmit(ev) {
    ev.preventDefault();
    const url = isLoginOrRegister === "register" ? "register" : "login";
    const { data } = await axios.post(
      url,
      { username, password },
      { withCredentials: true }
    );
    setLoggedInUsername(username);
    setId(data.id);
  }

  return (
    <div className="bg-blue-50 h-screen flex items-center">
      <form className="w-64 mx-auto mb-12" onSubmit={handleSubmit} action="">
        <input
          value={username}
          onChange={(ev) => setUsername(ev.target.value)}
          type="text"
          placeholder="UserName"
          className="block w-full rounded-sm p-2 mb-2 border"
        />
        <input
          value={password}
          onChange={(ev) => setPassword(ev.target.value)}
          type="password"
          placeholder="Password"
          className="block w-full rounded-sm p-2 mb-2 border"
        />
        <button className="bg-blue-500 text-white block w-full rounded-sm p-2">
          {isLoginOrRegister === "register" ? "Register" : "Login"}
        </button>
        <div className="text-center nt-2">
          {isLoginOrRegister === "register" && (
            <div>
              Already a member ?
              <button onClick={() => setLoginOrRegister("login")}>
                Login here
              </button>
            </div>
          )}
          {isLoginOrRegister === "login" && (
            <div>
              Don't have an account ?
              <button onClick={() => setLoginOrRegister("register")}>
                Register
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};

export default Register;
