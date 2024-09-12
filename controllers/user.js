// import { compare ,hash} from "bcrypt";
import bcrypt from 'bcryptjs'

import { NEW_REQUEST, REFETCH_CHATS } from "../constants/events.js";
import { getOtherMember } from "../lib/helper.js";
import { TryCatch } from "../middlewares/error.js";
import { Chat } from "../models/chat.js";
import { Request } from "../models/request.js";
import { User } from "../models/user.js";
import {
  cookieOptions,
  emitEvent,
  sendToken,
  uploadFilesToCloudinary,
} from "../utils/features.js";
import { ErrorHandler } from "../utils/utility.js";
import { sendPasswordResetEmail, sendResetSuccessEmail, sendVerificationEmail, sendWelcomeEmail } from "../mailtrap/emails.js";
import crypto from "crypto";
import { response } from "express";


// Create a new user and save it to the database and save token in cookie
const newUser = TryCatch(async (req, res, next) => {
  const { name, email, username, password, bio } = req.body;

  const file = req.file;

  if (!file) return next(new ErrorHandler("Please Upload Avatar"));

  const result = await uploadFilesToCloudinary([file]);

  const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

  const avatar = {
    public_id: result[0].public_id,
    url: result[0].url,
  };
  const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

  const user = await User.create({
    name,
    bio,
    email,
    username,
    password:hashedPassword,
    avatar,
    verificationToken,
    verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  });
  await sendVerificationEmail(user.email, verificationToken);

  return res.status(200).send({
    success: true,
    user: user
  })


});

// Login user and save token in cookie
const login = TryCatch(async (req, res, next) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username }).select("+password");

  if (!user) return next(new ErrorHandler("Invalid Username or Password", 404));

  // const isMatch = await compare(password, user.password);
  const isMatch  = await bcrypt.compare(password, user?.password || "");
  user.lastLogin = new Date();

  if (!isMatch)
    return next(new ErrorHandler("Invalid Username or Password", 404));

  sendToken(res, user, 200, `Welcome Back, ${user.name}`);
});




export const verifyEmail = async (req, res) => {
  try {
    const { code } = req.body;

    const user = await User.findOne({
      verificationToken: code,
      // Ensuring token not expired
      verificationTokenExpiresAt: { $gt: Date.now() }
    })

    if (!user) {
      return res.status(403).send({ success: false, message: "Invalid or expired verfication Code" })

    }
    user.isVerified = true
    user.verificationToken = undefined,
    user.verificationTokenExpiresAt = undefined,
    await user.save()
    sendToken(res, user, 201, "User created");


    
  } catch (error) {
    console.log("Error While Verifying Email", error);
    return res.status(500).send({
      success: false,
      error: error.message

    })


  }
}


export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body

    const user = await User.findOne({ email: email })
    if (!user) {
      return res.status(404).json({ success: false, message: "Email not found" })
    }
    // Genrerate reset token

    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetTokenExpiresAt = Date.now() + 1 * 60 * 60 * 1000;//1hr

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiresAt = resetTokenExpiresAt;
    await user.save();

    // send mail
    sendPasswordResetEmail(user.email, `http://localhost:5173/reset-password/${resetToken}`)
    res.status(200).json({ success: true, message: "Password reset link sent to your email" });


  } catch (error) {
    console.log("Error in forgotPassword ", error);
    res.status(400).json({
      success: false,
      error: error,
      message: "Error in forgotPassword",
      mainMeesage: error.message

    });


  }
}

export const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpiresAt: { $gt: Date.now() },
  })
  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired token'
    })
  }
  // Update hashed Password in mongoDB
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
    user.password = hashedPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpiresAt = undefined;

  await user.save();

  await sendResetSuccessEmail(user.email)
  res.status(200).json({ success: true, message: "Password reset Successfully" });


}




const getMyProfile = TryCatch(async (req, res, next) => {
  const user = await User.findById(req.user);

  if (!user) return next(new ErrorHandler("User not found", 404));

  res.status(200).json({
    success: true,
    user,
  });
});

const logout = TryCatch(async (req, res) => {
  return res
    .status(200)
    .cookie("chattu-token", "", { ...cookieOptions, maxAge: 0 })
    .json({
      success: true,
      message: "Logged out successfully",
    });
});

const searchUser = TryCatch(async (req, res) => {
  const { name = "" } = req.query;

  // Finding All my chats
  const myChats = await Chat.find({ groupChat: false, members: req.user });

  //  extracting All Users from my chats means friends or people I have chatted with
  const allUsersFromMyChats = myChats.flatMap((chat) => chat.members);

  // Finding all users except me and my friends
  const allUsersExceptMeAndFriends = await User.find({
    _id: { $nin: allUsersFromMyChats },
    name: { $regex: name, $options: "i" },
  });

  // Modifying the response
  const users = allUsersExceptMeAndFriends.map(({ _id, name, avatar }) => ({
    _id,
    name,
    avatar: avatar.url,
  }));

  return res.status(200).json({
    success: true,
    users,
  });
});

const sendFriendRequest = TryCatch(async (req, res, next) => {
  const { userId } = req.body;

  const request = await Request.findOne({
    $or: [
      { sender: req.user, receiver: userId },
      { sender: userId, receiver: req.user },
    ],
  });

  if (request) return next(new ErrorHandler("Request already sent", 400));

  await Request.create({
    sender: req.user,
    receiver: userId,
  });

  emitEvent(req, NEW_REQUEST, [userId]);

  return res.status(200).json({
    success: true,
    message: "Friend Request Sent",
  });
});

const acceptFriendRequest = TryCatch(async (req, res, next) => {
  const { requestId, accept } = req.body;

  const request = await Request.findById(requestId)
    .populate("sender", "name")
    .populate("receiver", "name");

  if (!request) return next(new ErrorHandler("Request not found", 404));

  if (request.receiver._id.toString() !== req.user.toString())
    return next(
      new ErrorHandler("You are not authorized to accept this request", 401)
    );

  if (!accept) {
    await request.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Friend Request Rejected",
    });
  }

  const members = [request.sender._id, request.receiver._id];

  await Promise.all([
    Chat.create({
      members,
      name: `${request.sender.name}-${request.receiver.name}`,
    }),
    request.deleteOne(),
  ]);

  emitEvent(req, REFETCH_CHATS, members);

  return res.status(200).json({
    success: true,
    message: "Friend Request Accepted",
    senderId: request.sender._id,
  });
});

const getMyNotifications = TryCatch(async (req, res) => {
  const requests = await Request.find({ receiver: req.user }).populate(
    "sender",
    "name avatar"
  );

  const allRequests = requests.map(({ _id, sender }) => ({
    _id,
    sender: {
      _id: sender._id,
      name: sender.name,
      avatar: sender.avatar.url,
    },
  }));

  return res.status(200).json({
    success: true,
    allRequests,
  });
});

const getMyFriends = TryCatch(async (req, res) => {
  const chatId = req.query.chatId;

  const chats = await Chat.find({
    members: req.user,
    groupChat: false,
  }).populate("members", "name avatar");

  const friends = chats.map(({ members }) => {
    const otherUser = getOtherMember(members, req.user);

    return {
      _id: otherUser._id,
      name: otherUser.name,
      avatar: otherUser.avatar.url,
    };
  });

  if (chatId) {
    const chat = await Chat.findById(chatId);

    const availableFriends = friends.filter(
      (friend) => !chat.members.includes(friend._id)
    );

    return res.status(200).json({
      success: true,
      friends: availableFriends,
    });
  } else {
    return res.status(200).json({
      success: true,
      friends,
    });
  }
});

export {
  acceptFriendRequest,
  getMyFriends,
  getMyNotifications,
  getMyProfile,
  login,
  logout,
  newUser,
  searchUser,
  sendFriendRequest,
};
