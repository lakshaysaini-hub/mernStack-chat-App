import { useContext, useEffect } from "react";
import Register from "./Register";
import { UserContext } from "./UserContext";
import Chat from "./Chat";

export default function Routes() {
  const { username, id } = useContext(UserContext);

  if (username) {
    return <Chat></Chat>;
  }

  return <Register />;
}
