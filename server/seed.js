const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Project = require('./models/Project');
const Task = require('./models/Task');

const connectDB = require('./config/db');

const seedData = async () => {
  try {
    await connectDB();
    console.log('\n🌱 Starting database seed...\n');

    // Clear existing data
    await Task.deleteMany({});
    await Project.deleteMany({});
    await User.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Create users
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@taskflow.com',
      password: 'admin123',
      role: 'admin',
    });

    const john = await User.create({
      name: 'John Doe',
      email: 'john@taskflow.com',
      password: 'member123',
      role: 'member',
    });

    const jane = await User.create({
      name: 'Jane Smith',
      email: 'jane@taskflow.com',
      password: 'member123',
      role: 'member',
    });

    console.log('👤 Created 3 users');

    // Create projects
    const webApp = await Project.create({
      name: 'Website Redesign',
      description: 'Complete overhaul of the company website with modern design and improved UX.',
      status: 'active',
      members: [admin._id, john._id, jane._id],
      createdBy: admin._id,
    });

    const mobileApp = await Project.create({
      name: 'Mobile App Development',
      description: 'Build a cross-platform mobile application for customer engagement.',
      status: 'active',
      members: [admin._id, john._id],
      createdBy: admin._id,
    });

    const marketing = await Project.create({
      name: 'Q2 Marketing Campaign',
      description: 'Plan and execute the marketing strategy for Q2 product launch.',
      status: 'active',
      members: [admin._id, jane._id],
      createdBy: admin._id,
    });

    console.log('📁 Created 3 projects');

    // Helper for dates
    const daysFromNow = (days) => {
      const date = new Date();
      date.setDate(date.getDate() + days);
      return date;
    };

    // Create tasks
    const tasks = await Task.insertMany([
      // Website Redesign tasks
      {
        title: 'Design homepage mockup',
        description: 'Create a modern, responsive homepage design with hero section, features, and testimonials.',
        status: 'done',
        priority: 'high',
        dueDate: daysFromNow(-5), // past — done, not overdue
        assignedTo: jane._id,
        project: webApp._id,
        createdBy: admin._id,
      },
      {
        title: 'Implement responsive navigation',
        description: 'Build a mobile-first responsive navigation bar with hamburger menu and smooth transitions.',
        status: 'in-progress',
        priority: 'high',
        dueDate: daysFromNow(3),
        assignedTo: john._id,
        project: webApp._id,
        createdBy: admin._id,
      },
      {
        title: 'Set up CI/CD pipeline',
        description: 'Configure GitHub Actions for automated testing and deployment to staging.',
        status: 'todo',
        priority: 'medium',
        dueDate: daysFromNow(7),
        assignedTo: john._id,
        project: webApp._id,
        createdBy: admin._id,
      },
      {
        title: 'Write API documentation',
        description: 'Document all REST API endpoints with request/response examples using Swagger.',
        status: 'todo',
        priority: 'low',
        dueDate: daysFromNow(-2), // overdue!
        assignedTo: jane._id,
        project: webApp._id,
        createdBy: admin._id,
      },
      {
        title: 'Optimize database queries',
        description: 'Review and optimize slow MongoDB queries. Add proper indexes.',
        status: 'in-progress',
        priority: 'urgent',
        dueDate: daysFromNow(-1), // overdue!
        assignedTo: john._id,
        project: webApp._id,
        createdBy: admin._id,
      },

      // Mobile App tasks
      {
        title: 'Set up React Native project',
        description: 'Initialize the React Native project with TypeScript, navigation, and state management.',
        status: 'done',
        priority: 'high',
        dueDate: daysFromNow(-10),
        assignedTo: john._id,
        project: mobileApp._id,
        createdBy: admin._id,
      },
      {
        title: 'Build authentication screens',
        description: 'Create login, register, and forgot password screens with form validation.',
        status: 'in-progress',
        priority: 'high',
        dueDate: daysFromNow(5),
        assignedTo: john._id,
        project: mobileApp._id,
        createdBy: admin._id,
      },
      {
        title: 'Implement push notifications',
        description: 'Set up Firebase Cloud Messaging for push notifications on iOS and Android.',
        status: 'todo',
        priority: 'medium',
        dueDate: daysFromNow(14),
        assignedTo: john._id,
        project: mobileApp._id,
        createdBy: admin._id,
      },
      {
        title: 'App store submission prep',
        description: 'Prepare screenshots, descriptions, and metadata for App Store and Play Store submission.',
        status: 'todo',
        priority: 'low',
        dueDate: daysFromNow(-3), // overdue!
        assignedTo: john._id,
        project: mobileApp._id,
        createdBy: admin._id,
      },

      // Marketing tasks
      {
        title: 'Create social media calendar',
        description: 'Plan 30 days of social media content across Instagram, Twitter, and LinkedIn.',
        status: 'in-progress',
        priority: 'high',
        dueDate: daysFromNow(2),
        assignedTo: jane._id,
        project: marketing._id,
        createdBy: admin._id,
      },
      {
        title: 'Design email newsletter template',
        description: 'Create a reusable HTML email template for the weekly product newsletter.',
        status: 'todo',
        priority: 'medium',
        dueDate: daysFromNow(10),
        assignedTo: jane._id,
        project: marketing._id,
        createdBy: admin._id,
      },
      {
        title: 'Competitor analysis report',
        description: 'Research and compile a comprehensive analysis of top 5 competitors.',
        status: 'todo',
        priority: 'urgent',
        dueDate: daysFromNow(-4), // overdue!
        assignedTo: jane._id,
        project: marketing._id,
        createdBy: admin._id,
      },
    ]);

    console.log(`✅ Created ${tasks.length} tasks`);

    console.log('\n========================================');
    console.log('  🎉 Database seeded successfully!');
    console.log('========================================');
    console.log('\n📧 Test Credentials:');
    console.log('────────────────────────────────────────');
    console.log('  Admin:');
    console.log('    Email:    admin@taskflow.com');
    console.log('    Password: admin123');
    console.log('');
    console.log('  Member 1:');
    console.log('    Email:    john@taskflow.com');
    console.log('    Password: member123');
    console.log('');
    console.log('  Member 2:');
    console.log('    Email:    jane@taskflow.com');
    console.log('    Password: member123');
    console.log('────────────────────────────────────────\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedData();
