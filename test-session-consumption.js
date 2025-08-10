/**
 * Test script for session consumption functionality
 */

import mongoose from 'mongoose';
import { User, Appointment } from './server/src/models/index.js';

async function testSessionConsumption() {
  try {
    console.log('Testing session consumption functionality...');
    
    // Connect to MongoDB (adjust connection string as needed)
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dental-clinic');
    
    // Find a user with active subscription
    const user = await User.findOne({
      'subscription.status': 'active',
      'subscription.sessionsRemaining': { $gt: 0 }
    });
    
    if (!user) {
      console.log('❌ No user found with active subscription and remaining sessions');
      return;
    }
    
    console.log('📋 User found:');
    console.log(`- Name: ${user.name}`);
    console.log(`- Email: ${user.email}`);
    console.log(`- Sessions Remaining: ${user.subscription.sessionsRemaining}`);
    console.log(`- Total Sessions: ${user.subscription.totalSessions}`);
    console.log(`- Status: ${user.subscription.status}`);
    
    // Test consumeSession method
    const initialSessions = user.subscription.sessionsRemaining;
    
    console.log('\n🔄 Consuming a session...');
    await user.consumeSession();
    
    console.log('✅ Session consumed successfully!');
    console.log(`- Sessions Before: ${initialSessions}`);
    console.log(`- Sessions After: ${user.subscription.sessionsRemaining}`);
    console.log(`- Status: ${user.subscription.status}`);
    
    // Test edge case - consume all remaining sessions
    if (user.subscription.sessionsRemaining > 0) {
      console.log('\n🔄 Testing edge case - consuming all remaining sessions...');
      
      while (user.subscription.sessionsRemaining > 0) {
        await user.consumeSession();
        console.log(`Sessions remaining: ${user.subscription.sessionsRemaining}`);
      }
      
      console.log(`✅ All sessions consumed. Status: ${user.subscription.status}`);
      
      // Test consuming when no sessions left
      try {
        await user.consumeSession();
        console.log('❌ Should have thrown error when no sessions remaining');
      } catch (error) {
        console.log(`✅ Correctly threw error: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the test
testSessionConsumption();