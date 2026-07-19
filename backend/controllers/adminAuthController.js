const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

function signToken(admin) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return jwt.sign({ id: admin._id, role: "admin" }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  });
}

function sanitizeAdmin(admin) {
  return {
    id: admin._id,
    name: admin.name,
    email: admin.email,
  };
}

async function registerAdmin(req, res) {
  try {
    const { name, email, password, setupKey } = req.body;
    const adminCount = await Admin.countDocuments();

    if (
      adminCount > 0 &&
      (!process.env.ADMIN_SETUP_KEY || setupKey !== process.env.ADMIN_SETUP_KEY)
    ) {
      return res.status(403).json({
        success: false,
        message: "Admin setup key is required.",
      });
    }

    if (!email || !password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Email and a password of at least 8 characters are required.",
      });
    }

    if (await Admin.exists({ email })) {
      const duplicate = new Error("An admin with this email already exists.");
      duplicate.code = 11000;
      throw duplicate;
    }

    const admin = await Admin.create({ name, email, password });
    const token = signToken(admin);

    return res.status(201).json({
      success: true,
      admin: sanitizeAdmin(admin),
      token,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An admin with this email already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to create admin.",
    });
  }
}

async function loginAdmin(req, res) {
  try {
    const { email, password } = req.body;

    console.log("=================================");
    console.log("Login Request");
    console.log("Email:", email);
    console.log("Password Entered:", password);

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const admin = await Admin.findOne({ email }).select("+password");

    console.log("Admin Found:", admin);

    if (!admin) {
      console.log("❌ Admin not found.");
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    console.log("Stored Hash:", admin.password);

    const isMatch = await admin.matchPassword(password);

    console.log("Password Match:", isMatch);

    if (!isMatch) {
      console.log("❌ Password does not match.");
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = signToken(admin);

    console.log("✅ Login Successful");

    return res.status(200).json({
      success: true,
      admin: sanitizeAdmin(admin),
      token,
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to login.",
    });
  }
}

async function getAdminProfile(req, res) {
  return res.status(200).json({
    success: true,
    admin: sanitizeAdmin(req.admin),
  });
}

module.exports = {
  registerAdmin,
  loginAdmin,
  getAdminProfile,
};
