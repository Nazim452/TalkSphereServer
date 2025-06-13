import { userSocketIDs } from "../app.js";

export const getOtherMember = (members, userId) =>
  members.find((member) => member._id.toString() !== userId.toString());

export const getSockets = (users = []) => {
  const sockets = users.map((user) => userSocketIDs.get(user.toString()));

  return sockets;
};

export const getBase64 = (file) =>
  // file.mimetype: The MIME type (like image/jpeg or application/pdf) of the file. This specifies the file format.
  // file.buffer.toString("base64")} - converts the file's binary data (stored in file.buffer) into a Base64-encoded string.
  `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;


  // Example Output:
  // data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAoAAAAHgCAYAAADb...

