import mongoose from 'mongoose';

export async function connectToDatabase(): Promise<void> {
  try {
    await mongoose.connect('mongodb://mongo-inventory:27017/inventory_db');
    console.log('Connected to MongoDB for Products service');
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('Error connecting to MongoDB', err.message);
    } else {
      console.error('Error connecting to MongoDB', err);
    }
  }
}
