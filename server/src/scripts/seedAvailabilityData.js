import mongoose from 'mongoose';
import { config } from '../config/environment.js';
import AvailabilityTemplate from '../models/AvailabilityTemplate.js';
import Holiday from '../models/Holiday.js';
import User from '../models/User.js';

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(config.MONGODB_URI);
    console.log('MongoDB connected for seeding');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

const seedAvailabilityData = async () => {
  try {
    // Find an admin user to assign as creator
    let adminUser = await User.findOne({ role: 'admin' });
    
    if (!adminUser) {
      // Create a default admin user for seeding
      adminUser = await User.create({
        name: 'Admin User',
        phone: '+1234567890',
        email: 'admin@example.com',
        role: 'admin',
        isVerified: true
      });
      console.log('Created default admin user for seeding');
    }

    // Clear existing data
    await AvailabilityTemplate.deleteMany({});
    await Holiday.deleteMany({});
    console.log('Cleared existing availability data');

    // Create default template
    const defaultTemplate = await AvailabilityTemplate.create({
      templateName: 'Default Schedule',
      isDefault: true,
      workingHours: {
        start: '09:00',
        end: '17:00'
      },
      slotDuration: 30,
      breakTimes: [
        {
          start: '12:00',
          end: '13:00',
          reason: 'Lunch Break'
        }
      ],
      applicableDates: [],
      isActive: true,
      createdBy: adminUser._id
    });

    // Create extended hours template
    const extendedTemplate = await AvailabilityTemplate.create({
      templateName: 'Extended Hours',
      isDefault: false,
      workingHours: {
        start: '08:00',
        end: '20:00'
      },
      slotDuration: 30,
      breakTimes: [
        {
          start: '12:00',
          end: '13:00',
          reason: 'Lunch Break'
        },
        {
          start: '18:00',
          end: '18:30',
          reason: 'Dinner Break'
        }
      ],
      applicableDates: [],
      isActive: true,
      createdBy: adminUser._id
    });

    // Create morning only template
    const morningTemplate = await AvailabilityTemplate.create({
      templateName: 'Morning Only',
      isDefault: false,
      workingHours: {
        start: '09:00',
        end: '13:00'
      },
      slotDuration: 30,
      breakTimes: [],
      applicableDates: [],
      isActive: true,
      createdBy: adminUser._id
    });

    // Create afternoon only template
    const afternoonTemplate = await AvailabilityTemplate.create({
      templateName: 'Afternoon Only',
      isDefault: false,
      workingHours: {
        start: '14:00',
        end: '18:00'
      },
      slotDuration: 45,
      breakTimes: [],
      applicableDates: [],
      isActive: true,
      createdBy: adminUser._id
    });

    console.log('Created availability templates:', {
      default: defaultTemplate.templateName,
      extended: extendedTemplate.templateName,
      morning: morningTemplate.templateName,
      afternoon: afternoonTemplate.templateName
    });

    // Create some holidays
    const currentYear = new Date().getFullYear();
    const holidays = [
      {
        date: new Date(`${currentYear}-12-25`),
        reason: 'Christmas Day',
        type: 'public_holiday',
        isRecurring: true,
        recurringPattern: 'yearly',
        isActive: true,
        createdBy: adminUser._id
      },
      {
        date: new Date(`${currentYear}-01-01`),
        reason: 'New Year\'s Day',
        type: 'public_holiday',
        isRecurring: true,
        recurringPattern: 'yearly',
        isActive: true,
        createdBy: adminUser._id
      },
      {
        date: new Date(`${currentYear}-07-04`),
        reason: 'Independence Day',
        type: 'public_holiday',
        isRecurring: true,
        recurringPattern: 'yearly',
        isActive: true,
        createdBy: adminUser._id
      },
      {
        date: new Date(`${currentYear + 1}-03-15`),
        reason: 'Equipment Maintenance',
        type: 'maintenance',
        isRecurring: false,
        isActive: true,
        createdBy: adminUser._id
      }
    ];

    const createdHolidays = await Holiday.insertMany(holidays);
    console.log(`Created ${createdHolidays.length} holidays`);

    // Apply some custom templates to specific dates
    const futureDate1 = new Date();
    futureDate1.setDate(futureDate1.getDate() + 7); // Next week

    const futureDate2 = new Date();
    futureDate2.setDate(futureDate2.getDate() + 14); // Two weeks from now

    const futureDate3 = new Date();
    futureDate3.setDate(futureDate3.getDate() + 21); // Three weeks from now

    // Apply extended hours to some future dates
    await extendedTemplate.addDates([futureDate1, futureDate2]);
    console.log('Applied extended hours template to future dates');

    // Apply morning only to another future date
    await morningTemplate.addDates([futureDate3]);
    console.log('Applied morning only template to future date');

    console.log('\n✅ Availability data seeded successfully!');
    console.log('\nCreated data:');
    console.log('- 4 Availability Templates (1 default, 3 custom)');
    console.log('- 4 Holidays (3 recurring, 1 one-time)');
    console.log('- Applied custom templates to specific dates');
    console.log('\nYou can now test the availability system in the admin panel.');

  } catch (error) {
    console.error('Error seeding availability data:', error);
    throw error;
  }
};

const main = async () => {
  await connectDB();
  await seedAvailabilityData();
  await mongoose.disconnect();
  console.log('Database connection closed');
  process.exit(0);
};

// Handle script execution
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });
}

export default seedAvailabilityData;