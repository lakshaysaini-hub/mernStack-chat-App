import { useContext, useEffect, useState } from "react";
import Avatar from "./Avatar";
import Logo from "./Logo";
import { UserContext } from "./UserContext";
export default function Chat() {
  const { username, id } = useContext(UserContext);

  const [ws, setWs] = useState(null);

  const [selectedUserId, setselectedUserId] = useState(null);

  const [onlinePeople, setOnlinePeople] = useState({});

  const [newMessageText, setnewMessageText] = useState("");

  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:4000");
    setWs(ws);
    ws.addEventListener("message", handleMessage);
  }, []);

  function showOnlinePeople(peopleArray) {
    const people = {};
    peopleArray.forEach(({ userId, username }) => {
      people[userId] = username;
    });
    setOnlinePeople(people);
  }

  function handleMessage(ev) {
    const messageData = JSON.parse(ev.data);

    if ("online" in messageData) {
      showOnlinePeople(messageData.online);
    } else {
      setMessages((prev) => [
        ...prev,
        { text: messageData.text, isOur: false },
      ]);
    }
  }

  function sendMessage(ev) {
    ev.preventDefault();
    ws.send(
      JSON.stringify({
        recipient: selectedUserId,
        text: newMessageText,
      })
    );
    setnewMessageText("");
    setMessages((prev) => [...prev, { text: newMessageText, isOur: true }]);
  }

  const onlinePeopleExcOurUser = { ...onlinePeople };

  delete onlinePeopleExcOurUser[id];

  return (
    <div className="flex h-screen">
      <div className="bg-white w-1/4 ">
        <Logo />

        {Object.keys(onlinePeopleExcOurUser).map((userId) => (
          <div
            key={userId}
            onClick={() => setselectedUserId(userId)}
            className={`border-b border-gray-100  flex items-center gap-2 cursor-pointer 
              ${userId === selectedUserId ? "bg-blue-50" : ""}`}
          >
            {userId === selectedUserId && (
              <div className="w-1 bg-blue-500 h-12 rounded-r-md"></div>
            )}
            <div className=" flex gap-2 py-2 pl-4 items-center">
              <Avatar username={onlinePeople[userId]} userId={userId} />
              <span className="text-gray-800">{onlinePeople[userId]}</span>
            </div>
          </div>
        ))}
      </div>
      <div className=" flex flex-col bg-blue-50 w-3/4 p-2">
        <div className="flex-grow">
          {!selectedUserId && (
            <div
              className="flex h-full
            flex-grow items-center justify-center"
            >
              <div className="   text-gray-400 ">
                Select a person to start a conversation.
              </div>
            </div>
          )}
        </div>

        {!!selectedUserId && (
          //showimg messages
          <div>
            {messages.map((message) => (
              <div>{message.text}</div>
            ))}
          </div>
        )}

        {!!selectedUserId && (
          // Showing footer buttons
          <form className="flex gap-2" onSubmit={sendMessage}>
            <input
              type="text"
              value={newMessageText}
              onChange={(ev) => setnewMessageText(ev.target.value)}
              placeholder="Type your message here"
              className="bg-white border p-2 flex-grow rounded-sm"
            />
            <button
              type="submit"
              className="bg-blue-500 p-2 text-white rounded-sm cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
                />
              </svg>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
