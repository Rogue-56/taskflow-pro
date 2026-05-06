require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const User = require('./models/User');
const Project = require('./models/Project');
const Task = require('./models/Task');
const Team = require('./models/Team');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected for seeding');
  } catch (error) {
    console.error('Connection error:', error.message);
    process.exit(1);
  }
};

const seed = async () => {
  await connectDB();

  // Clear existing data
  await User.deleteMany({});
  await Project.deleteMany({});
  await Task.deleteMany({});
  await Team.deleteMany({});
  console.log('Cleared existing data');

  // Create users (3 roles)
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@taskflow.com',
    password: 'admin123',
    role: 'admin',
  });

  const manager1 = await User.create({
    name: 'Sarah Manager',
    email: 'sarah@taskflow.com',
    password: 'manager123',
    role: 'manager',
  });

  const manager2 = await User.create({
    name: 'Mike Lead',
    email: 'mike@taskflow.com',
    password: 'manager123',
    role: 'manager',
  });

  const member1 = await User.create({
    name: 'John Doe',
    email: 'john@taskflow.com',
    password: 'member123',
    role: 'member',
  });

  const member2 = await User.create({
    name: 'Jane Smith',
    email: 'jane@taskflow.com',
    password: 'member123',
    role: 'member',
  });

  const member3 = await User.create({
    name: 'Alex Kumar',
    email: 'alex@taskflow.com',
    password: 'member123',
    role: 'member',
  });

  const member4 = await User.create({
    name: 'Priya Sharma',
    email: 'priya@taskflow.com',
    password: 'member123',
    role: 'member',
  });

  console.log('Created users (1 admin, 2 managers, 4 members)');

  // Create teams
  const team1 = await Team.create({
    name: 'Engineering',
    description: 'Core product engineering team',
    manager: manager1._id,
    members: [member1._id, member2._id],
    createdBy: admin._id,
  });

  const team2 = await Team.create({
    name: 'Design',
    description: 'UI/UX and product design team',
    manager: manager2._id,
    members: [member3._id, member4._id],
    createdBy: admin._id,
  });

  console.log('Created 2 teams');

  // Create projects
  const project1 = await Project.create({
    name: 'Mobile App Development',
    description: 'Cross-platform mobile application using React Native',
    status: 'active',
    members: [admin._id, manager1._id, member1._id, member2._id],
    createdBy: admin._id,
  });

  const project2 = await Project.create({
    name: 'Website Redesign',
    description: 'Complete overhaul of the company marketing website',
    status: 'active',
    members: [admin._id, manager2._id, member3._id, member4._id],
    createdBy: admin._id,
  });

  const project3 = await Project.create({
    name: 'API Integration',
    description: 'Third-party payment and analytics API integration',
    status: 'active',
    members: [admin._id, manager1._id, member1._id],
    createdBy: manager1._id,
  });

  console.log('Created 3 projects');

  // Create tasks
  const now = new Date();
  const tasks = [
    { title: 'Set up React Native project', description: 'Initialize project with Expo and configure navigation', status: 'done', priority: 'high', dueDate: new Date(now.getTime() + 2 * 86400000), assignedTo: [member1._id, member2._id], project: project1._id, createdBy: manager1._id },
    { title: 'Design login screen', description: 'Create UI mockups for the authentication flow', status: 'in-progress', priority: 'medium', dueDate: new Date(now.getTime() + 5 * 86400000), assignedTo: [member2._id], project: project1._id, createdBy: manager1._id },
    { title: 'Implement push notifications', description: 'Set up Firebase Cloud Messaging for push notifications on iOS and Android.', status: 'todo', priority: 'medium', dueDate: new Date(now.getTime() + 14 * 86400000), assignedTo: [member1._id], project: project1._id, createdBy: manager1._id },
    { title: 'Homepage wireframe', description: 'Create wireframe for the new homepage layout', status: 'done', priority: 'high', dueDate: new Date(now.getTime() + 3 * 86400000), assignedTo: [member3._id, member4._id], project: project2._id, createdBy: manager2._id },
    { title: 'Responsive CSS framework', description: 'Set up design system with CSS variables and responsive grid', status: 'in-progress', priority: 'medium', dueDate: new Date(now.getTime() + 7 * 86400000), assignedTo: [member4._id], project: project2._id, createdBy: manager2._id },
    { title: 'SEO audit', description: 'Run full SEO audit on current site and document improvements', status: 'todo', priority: 'low', dueDate: new Date(now.getTime() + 10 * 86400000), assignedTo: [member3._id], project: project2._id, createdBy: manager2._id },
    { title: 'Payment gateway integration', description: 'Integrate Stripe for subscription billing', status: 'todo', priority: 'urgent', dueDate: new Date(now.getTime() - 2 * 86400000), assignedTo: [member1._id, member2._id], project: project3._id, createdBy: manager1._id },
    { title: 'Analytics dashboard API', description: 'Connect Google Analytics and Mixpanel data endpoints', status: 'in-progress', priority: 'high', dueDate: new Date(now.getTime() + 6 * 86400000), assignedTo: [member1._id], project: project3._id, createdBy: admin._id },
  ];

  await Task.insertMany(tasks);
  console.log(`Created ${tasks.length} tasks`);

  console.log('\n--- Seed Complete ---');
  console.log('Accounts:');
  console.log('  Admin:    admin@taskflow.com / admin123');
  console.log('  Manager:  sarah@taskflow.com / manager123');
  console.log('  Manager:  mike@taskflow.com  / manager123');
  console.log('  Member:   john@taskflow.com  / member123');
  console.log('  Member:   jane@taskflow.com  / member123');
  console.log('  Member:   alex@taskflow.com  / member123');
  console.log('  Member:   priya@taskflow.com / member123');

  process.exit(0);
};

seed();
