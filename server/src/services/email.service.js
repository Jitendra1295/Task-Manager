const { SESv2Client, SendEmailCommand } = require('@aws-sdk/client-sesv2');

const ses = new SESv2Client({ region: 'ap-south-1' });

const sendWelcomeEmail = async (email, name) => {
  const command = new SendEmailCommand({
    FromEmailAddress: 'pateljitendra055@gmail.com',
    Destination: {
      ToAddresses: [email],
    },
    Content: {
      Simple: {
        Subject: {
          Data: 'Welcome to Task Manager!',
        },
        Body: {
          Text: {
            Data: `Hi ${name}, welcome to Task Manager!`,
          },
        },
      },
    },
  });

  return ses.send(command);
};

module.exports = { sendWelcomeEmail };
