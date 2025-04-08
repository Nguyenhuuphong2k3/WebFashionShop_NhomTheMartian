const nodemailer = require("nodemailer");

// kéo code và chạy chức năng tìm mk
// cài thư viện multer

const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 25,
    secure: false, // true for port 465, false for other ports
    auth: {
        user: "",
        pass: "",
    },
});

module.exports = {
    sendmail: async function (to, subject, text, html) {
        return await transporter.sendMail({
            to:to,
            from:"Nguyenhuuphong2k3@gmail.com",
            text:text,
            html:`<a href=${text}>URL</a>`
        })
    }
}