import { useContext, useEffect, useState, useRef } from "react";
import Avatar from "./Avatar";
import Logo from "./Logo";
import { UserContext } from "./UserContext";
import uniqBy from "lodash/uniqBy";
import axios from "axios";
import Contacts from "./Contacts";

export default function Chat() {
  const { username, id } = useContext(UserContext);

  const [ws, setWs] = useState(null);

  const [selectedUserId, setselectedUserId] = useState(null);

  const [onlinePeople, setOnlinePeople] = useState({});

  const [offinePeople, setOffinePeople] = useState({});

  const [newMessageText, setnewMessageText] = useState("");

  const [messages, setMessages] = useState([]);

  //Add reference for the bottom object
  const divUnderMessages = useRef();

  // function to connect ot websocket and also try to reconnect if closed somehow

  useEffect(() => {
    connectToWs();
  }, []);

  function connectToWs() {
    const ws = new WebSocket("ws://localhost:4000");
    setWs(ws);
    ws.addEventListener("message", handleMessage);
    ws.addEventListener("close", () => {
      setTimeout(() => {
        console.log("Disconnected .Trying to reconnect.");
        connectToWs();
      }, 1000);
    });
  }

  function showOnlinePeople(peopleArray) {
    const people = {};
    peopleArray.forEach(({ userId, username }) => {
      people[userId] = username;
    });
    setOnlinePeople(people);
  }

  // handling the message recieved from wss
  //showing online people and showing incoming messages
  function handleMessage(ev) {
    const messageData = JSON.parse(ev.data);

    if ("online" in messageData) {
      showOnlinePeople(messageData.online);
    } else if ("text" in messageData) {
      setMessages((prev) => [...prev, { ...messageData }]);
    }
  }

  // filtering dupllicates messages (2 time rendering fault using lodash)
  // using unique database id

  const messageWithoutDupes = uniqBy(messages, "_id");

  // Sending message from inbox to web socket server
  function sendMessage(ev) {
    ev.preventDefault();
    if (!newMessageText.trim()) return;
    ws.send(
      JSON.stringify({
        recipient: selectedUserId,
        text: newMessageText,
      })
    );
    setnewMessageText("");
    setMessages((prev) => [
      ...prev,
      {
        text: newMessageText,
        sender: id,
        recipient: selectedUserId,
        _id: Date.now().toString(),
      },
    ]);
  }

  // using to detect when msg got changed to make scroll bar go to bottom
  useEffect(() => {
    const div = divUnderMessages.current;
    if (div) {
      div.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages]);

  // acessing old messages sent/recieved previously on selecting user from database

  useEffect(() => {
    if (selectedUserId) {
      axios.get("/messages/" + selectedUserId).then((res) => {
        setMessages(res.data);
      });
    }
  }, [selectedUserId]);

  //getting all the user from database when online people changes

  useEffect(() => {
    axios.get("/people").then((res) => {
      const offlinePeopleArr = res.data
        .filter((p) => p._id !== id) //not including me
        .filter((p) => !Object.keys(onlinePeople).includes(p._id)); //not including other online people

      const offlinePeoples = {};
      offlinePeopleArr.forEach((p) => {
        offlinePeoples[p._id] = p.username;
      });
      setOffinePeople(offlinePeoples);
    });
  }, [onlinePeople]);

  // removing the redundant ourselv from set of online users
  const onlinePeopleExcOurUser = { ...onlinePeople };
  delete onlinePeopleExcOurUser[id];

  return (
    <div className="flex h-screen">
      <div className="bg-white w-1/4">
        <Logo />
        {Object.keys(onlinePeopleExcOurUser).map((userId) => (
          <Contacts
            key={userId}
            id={userId}
            username={onlinePeopleExcOurUser[userId]}
            selectedUserId={selectedUserId}
            onClick={() => setselectedUserId(userId)}
            selected={userId === selectedUserId}
            online={true}
          />
        ))}
        {Object.keys(offinePeople).map((userId) => (
          <Contacts
            key={userId}
            id={userId}
            username={offinePeople[userId]}
            selectedUserId={selectedUserId}
            onClick={() => setselectedUserId(userId)}
            selected={userId === selectedUserId}
            online={false}
          />
        ))}
      </div>
      <div className=" flex flex-col bg-blue-50 w-3/4  pl-2 pt-2 pb-2">
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
          {!!selectedUserId && (
            // displaying messages either sent or typed by user
            <div className="relative h-full">
              <div className=" overflow-y-scroll absolute top-0 left-0 right-0 bottom-2">
                {messageWithoutDupes.map((message) => (
                  <div
                    key={message._id}
                    className={` pr-3 ${
                      message.sender === id ? "text-right" : "text-left"
                    } `}
                  >
                    <div
                      className={`
                 text-left inline-block p-2 my-1 rounded-md text-sm
                ${
                  message.sender === id
                    ? "bg-blue-500 text-white"
                    : "bg-white text-gray-500"
                }`}
                    >
                      {message.text}
                    </div>
                  </div>
                ))}
                <div ref={divUnderMessages}></div>
              </div>
            </div>
          )}
        </div>
        {!!selectedUserId && (
          // Showing footer buttons ans sending inbox only on selection of a user
          <form className="flex gap-1 mr-1" onSubmit={sendMessage}>
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
