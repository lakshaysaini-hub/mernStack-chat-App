export default function Avatar({ userId, username, online }) {
  const colors = [
    "bg-red-100",
    "bg-green-100",
    "bg-purple-100",
    "bg-blue-100",
    "bg-yellow-100",
    "bg-teal-100",
  ];

  // const userIBase10 = parseInt(userId, 16);
  // const colorIndex = userIBase10 % colors.length;
  // const color = colors[colorIndex];

  // unique color index logic
  const hashString = (str) => {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 33) ^ str.charCodeAt(i);
    }
    return Math.abs(hash);
  };

  const color = colors[hashString(userId) % colors.length];

  return (
    <div className={`w-9 h-9 relative ${color} rounded-full flex items-center`}>
      <div className="text-center w-full opacity-70">{username[0]}</div>
      {online && (
        <div className="absolute w-2 h-2 bg-green-400 bottom-0 right-0 rounded-full "></div>
      )}
      {!online && (
        <div className="absolute w-2 h-2 bg-gray-400 bottom-0 right-0 rounded-full "></div>
      )}
    </div>
  );
}
