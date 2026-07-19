const nodemailer = require("nodemailer");

function hasEmailConfig() {
  return Boolean(
    process.env.EMAIL_USER &&
    process.env.MAIL_FROM &&
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REFRESH_TOKEN
  );
}

let cachedTransporter = null;

async function createTransporter() {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  if (!hasEmailConfig()) {
    return null;
  }

  cachedTransporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: process.env.EMAIL_USER,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
    },
  });

  return cachedTransporter;
}

async function sendOfferLetterEmail(student, attachment = {}) {
  const transporter = await createTransporter();

  if (!transporter) {
    return {
      skipped: true,
      reason: "Email configuration missing.",
    };
  }

  const issueDate = student.offerLetter?.issueDate
    ? new Date(student.offerLetter.issueDate).toLocaleDateString("en-IN")
    : student.offerLetterUploadedDate
    ? new Date(student.offerLetterUploadedDate).toLocaleDateString("en-IN")
    : new Date().toLocaleDateString("en-IN");

  const pdfAttachment = attachment.buffer
    ? {
        filename: attachment.filename || "DRDO-Internship-Offer-Letter.pdf",
        content: attachment.buffer,
        contentType: "application/pdf",
      }
    : {
        filename: attachment.filename || "DRDO-Internship-Offer-Letter.pdf",
        path: attachment.url || student.offerLetter?.url || student.offerLetterUrl,
      };

  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: student.email,
    subject: "DRDO Internship Offer Letter",
    text: `Dear ${student.name},

Congratulations!

Your internship application has been approved. Please find your DRDO Internship Offer Letter attached.

Offer Letter Issue Date: ${issueDate}

Regards,
Internship Management Team`,
    attachments: [pdfAttachment],
  });

  return {
    skipped: false,
    messageId: info.messageId,
  };
}

async function sendRejectionEmail(student) {
  const transporter = await createTransporter();

  if (!transporter) {
    return {
      skipped: true,
      reason: "Email configuration missing.",
    };
  }

  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: student.email,
    subject: "Internship Application Status",
    text: `Dear ${student.name},

We regret to inform you that your internship application has been rejected.

Remark:
${student.remark || "Please contact the administration for more information."}

Regards,
Internship Management Team`,
  });

  return {
    skipped: false,
    messageId: info.messageId,
  };
}

async function sendRegistrationConfirmationEmail(student) {
  const transporter = await createTransporter();

  if (!transporter) {
    return {
      skipped: true,
      reason: "Email configuration missing.",
    };
  }

  const info = await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: student.email,
    subject: "DRDO Internship Registration Confirmation",
    text: `Dear ${student.name},

Your internship registration has been submitted successfully.

Reference ID: ${student.referenceId}
Serial Number: ${student.serialNumber || "-"}

Please keep this Reference ID safe. You will need your registered email address and Reference ID to log in to the Student Portal.

Regards,
Internship Management Team`,
  });

  return {
    skipped: false,
    messageId: info.messageId,
  };
}

module.exports = {
  sendOfferLetterEmail,
  sendRegistrationConfirmationEmail,
  sendRejectionEmail,
};