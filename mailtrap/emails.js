import { PASSWORD_RESET_SUCCESS_TEMPLATE, VERIFICATION_EMAIL_TEMPLATE,PASSWORD_RESET_REQUEST_TEMPLATE } from "./emailTemplates.js";
import { mailtrapClient, sender } from "./mailtrap.js";

export const sendVerificationEmail = async(email,verificationToken) => {
    const recipient = [{email}];
    try {

        const response = await mailtrapClient.send({
            from:sender,
            to:recipient,
            subject:"Verify Your Email",
            // verificationCode wale class ko OTP se replace kar dena hai
            html:VERIFICATION_EMAIL_TEMPLATE.replace("{verificationCode}", verificationToken),
            category:"Email verification"
            
        })

        console.log("Email Sent Successfully", response);
        
        

    } catch (error) {
        console.log("ERROR WHILE Verification Email Sent", error);

        
        
    }
}


export const sendWelcomeEmail = async(email , name)=>{
    try {
        const recipient = [{email}];
        const res = await mailtrapClient.send({
            from:sender,
            to:recipient,
            template_uuid: "835b74e1-7cdb-4e50-8411-4fcc786d1821",
            template_variables: {
                "company_info_name": "TalkSphere",
                "name": name
              }
        })
        console.log("Welcome email sent successfully ",res);
        
        
    } catch (error) {
        console.log("ERROR WHILE Send Welcome Email Sent",);
        
        
    }
}


export const  sendPasswordResetEmail = async(email,resetURL)=>{
    try {
        const recipient = [{email}]
        
        const response = await mailtrapClient.send({
            from:sender,
            to:recipient,
            subject:"Reset Your Password",
            html:PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetURL),
            category: "Reset Password"

        })

    } catch (error) {

        console.log("Error While sending reset password Email", error);
        
        
    }
}


export const sendResetSuccessEmail = async(email)=>{
    try {
        const recepient = [{email}];

        await mailtrapClient.send({
            from:sender,
            to:recepient,
            subject:"Reset Password",
            html:PASSWORD_RESET_SUCCESS_TEMPLATE,
            category:"Reset Password"
        })
        
    } catch (error) {
        console.log("Error While sending reset password Email", error);
        
        
    }
}











