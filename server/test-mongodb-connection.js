import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const testConnection = async () => {
  console.log('Testing MongoDB connection...');
  console.log('MongoDB URI:', process.env.MONGODB_URI?.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
  
  try {
    // Test with different connection options
    const options = {
      serverSelectionTimeoutMS: 10000, // 10 seconds
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4, skip trying IPv6
      maxPoolSize: 10,
      retryWrites: true,
      w: 'majority'
    };
    
    await mongoose.connect(process.env.MONGODB_URI, options);
    console.log('✅ MongoDB connected successfully!');
    
    // Test a simple operation
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📁 Available collections:', collections.map(c => c.name));
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    if (error.reason) {
      console.error('Topology:', error.reason.type);
      console.error('Servers:', Array.from(error.reason.servers.keys()));
    }
    
    // Suggest solutions
    console.log('\n🔧 Possible solutions:');
    console.log('1. Check if your IP is whitelisted (you mentioned 0.0.0.0/0 is added)');
    console.log('2. Verify username and password are correct');
    console.log('3. Check if the cluster is paused/suspended');
    console.log('4. Try connecting from MongoDB Compass with the same URI');
    console.log('5. Check MongoDB Atlas status: https://status.mongodb.com/');
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

testConnection();