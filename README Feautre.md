# TalkSphereServer


<h1> Authentication Module </h1>

1. High level authentication using OTP  , verification using OTP vial Email.
2. Fotgot password  & rest password through email.
3. Strength of password checking



<h1> Chat </h1>

1. At a time only 20 messages will be fetched from DB  next fetch when we up.
2. While Searching user Debouncing Used.
3. RTK Query Used For data fetching - provide cache Meachnism.
4. State management - Redux Toolkit.
5. Image - Cloudinary.

6. Validations - express-validator.
7. Show number of online user.
8. Show who is typing.
9. Check internet connectivity.
10. Can Send all types of media


11. Manage Member by adding or removing friend.
12. Can delete the chat by right clicking or leave from the group chat.
13. Chat will be enable after mutual acceptations.

<h1> Tech Stack </h1>
1. MERN
2. Cloudinary
3. WebSocket.
4. Redux Toolkit.
5. Material UI.
6. Mailtrap
7. Used Styled components - Feature of Material UI.



<h1>Q1 - How dealing with file ?</h1>

Iterating on File using map method & for each & every files generated a new Promise then waiting for resolving the promise using promise.all method & then formatting the promise into public_id * url- Secure Url.

First taking from req.file & then using multer middleware deerminging there file size , converting into base64 (file.mimetype - used to detect the types of file) for storing in JSON format then uploading this file to cloudinary - When uploading files to services like Cloudinary, some APIs accept Base64-encoded file data instead of raw binary data. Providing resuouce type="auto" , ensuring cloudinary automaticllly detect  the types of file.

Passing multer funcation for single file  in the express middleware in  when we dealing with file. 

Generating Public_id for each image apart from secure URL...
public_id is a unique string assigned to each uploaded file, which acts as the file's identifier in Cloudinary.
If not provided, Cloudinary generates a random public_id automatically. However, providing a custom public_id allows you to define meaningful, predictable identifiers.




<h1>How Forgot & Reset Password Works</h1>

1. Extract email
2. Using cypto package  generating  20 character of random bytes in hexa-decimal.
3. Setting reset token expires time for one hourr.
4. Inserting this  token  to DB & sending mail for reset password.


<!-- Reset Password -->

1. Extracting token from the params
2. Extracting password from the req.body
3.  Finding whether this token present in  the DB or not && checking expiration time.
4. Hashing the password & updating in DB & sending reset message to the user.
5. Making token & expiraton undefined for security Purposes so noone can access it again.


















<!-- For the localhost -->

 sendPasswordResetEmail(user.email, `http://localhost:5173/reset-password/${resetToken}`)
 res.status(200).json({ success: true, message: "Password reset link sent to your email" });



 sendPasswordResetEmail(user.email, `https://talk-sphre-nazim.vercel.app/reset-password/${resetToken}`)
 res.status(200).json({ success: true, message: "Password reset link sent to your email" });

