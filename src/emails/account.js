const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'eltoncheungg@gmail.com',
        subject: 'Welcome to Task Manager!',
        text: `Welcome to the app, ${name}. Let me know how you get along with the app.`
    })
};

const sendCancellationEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'eltoncheungg@gmail.com',
        subject: "We're sorry that you quit.",
        text: `Hope to see you again, ${name}.`
    })
};

module.exports = {
    sendWelcomeEmail,
    sendCancellationEmail
};
