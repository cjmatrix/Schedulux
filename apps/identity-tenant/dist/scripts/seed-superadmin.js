import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { SuperAdmin } from '../model/SuperAdmin.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load .env from apps/identity-tenant root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/schedulux_identity';
async function seedSuperAdmin() {
    const email = process.argv[2] || 'mikey@gmail.com';
    const rawPassword = process.argv[3] || 'mikey@123';
    const name = process.argv[4] || 'Mikey';
    console.log('Connecting to MongoDB at:', MONGO_URI.replace(/\/\/[^@]*@/, '//***:***@'));
    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB connected successfully.');
        const password_hash = await bcrypt.hash(rawPassword, 12);
        const existingAdmin = await SuperAdmin.findOne({ email: email.toLowerCase().trim() });
        if (existingAdmin) {
            existingAdmin.password_hash = password_hash;
            existingAdmin.name = name;
            existingAdmin.role = 'super_admin';
            await existingAdmin.save();
            console.log(`Updated existing SuperAdmin successfully:`);
            console.log(`  - ID: ${existingAdmin._id}`);
            console.log(`  - Email: ${existingAdmin.email}`);
            console.log(`  - Name: ${existingAdmin.name}`);
            console.log(`  - Role: ${existingAdmin.role}`);
        }
        else {
            const newAdmin = await SuperAdmin.create({
                email: email.toLowerCase().trim(),
                name,
                password_hash,
                role: 'super_admin',
            });
            console.log(`Created new SuperAdmin successfully:`);
            console.log(`  - ID: ${newAdmin._id}`);
            console.log(`  - Email: ${newAdmin.email}`);
            console.log(`  - Name: ${newAdmin.name}`);
            console.log(`  - Role: ${newAdmin.role}`);
        }
        console.log('\nSuperAdmin Credentials:');
        console.log(`  Email: ${email}`);
        console.log(`  Password: ${rawPassword}`);
    }
    catch (err) {
        console.error('Failed to seed SuperAdmin:', err);
        process.exit(1);
    }
    finally {
        await mongoose.disconnect();
        console.log('MongoDB connection closed.');
    }
}
seedSuperAdmin();
