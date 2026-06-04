import mongoose from "mongoose";

export async function connectMongo(uri) {
  if (!uri) {
    throw new Error(
      "MONGO_URL is not set in server/.env — cannot start without MongoDB Atlas."
    );
  }

  await mongoose.connect(uri, {
    // Recommended options for MongoDB Atlas
    serverSelectionTimeoutMS: 10000, // 10 s to pick a server
    socketTimeoutMS: 45000,          // close sockets after 45 s of inactivity
  });

  console.log("✅ MongoDB Atlas connected successfully");
}

// Keep backward-compat alias so nothing else breaks if it was imported elsewhere
export const connectMongoOptional = connectMongo;
