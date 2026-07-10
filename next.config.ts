import fs from 'fs';
import path from 'path';

try {
  // This will print the exact contents of your checkin folder to the Vercel log
  const dirPath = path.resolve(process.cwd(), 'app/checkin/[eventId]');
  console.log("=== DEBUG: FILES IN [eventId] FOLDER ===", fs.readdirSync(dirPath));
} catch (e) {
  // Safely cast 'e' to a string to satisfy strict TypeScript rules
  console.log("=== DEBUG: COULD NOT READ FOLDER ===", String(e));
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* your existing config config options here */
};

export default nextConfig;