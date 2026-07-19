require("dotenv").config();

const Admin = require("./models/Admin");

async function seedAdmins() {
  try {
    // Admin 1
    const admin1 = {
      name: "Naina",
      email: "naina@gmail.com",
      password: "Admin@123",
    };

    // Admin 2
    const admin2 = {
      name: "Vaibhav Gupta",
      email: "vaibhav@gmail.com",
      password: "Admin@123",
    };

    // Check if Naina already exists
    const existingAdmin1 = await Admin.findOne({ email: admin1.email });

    if (!existingAdmin1) {
      await Admin.create(admin1);
      console.log("✅ Naina created.");
    } else {
      console.log("ℹ️ Naina already exists.");
    }

    // Check if Vaibhav Gupta already exists
    const existingAdmin2 = await Admin.findOne({ email: admin2.email });

    if (!existingAdmin2) {
      await Admin.create(admin2);
      console.log("✅ Vaibhav Gupta created.");
    } else {
      console.log("ℹ️ Vaibhav Gupta already exists.");
    }

    console.log("🎉 Admin seeding completed.");
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

seedAdmins();
