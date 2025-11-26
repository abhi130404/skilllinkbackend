const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI not set in env");

  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log("MongoDB connected");

    // Get native MongoDB client
    const client = mongoose.connection.getClient();

    // List all databases
    const adminDb = client.db().admin();
    const result = await adminDb.listDatabases();

    console.log("Databases in cluster:");
    result.databases.forEach(db => console.log(` - ${db.name}`));

  } catch (err) {
    console.error("DB connection failed:", err);
    process.exit(1);
  }
};

module.exports = connectDB;
