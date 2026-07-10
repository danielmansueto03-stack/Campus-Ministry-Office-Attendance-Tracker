import fs from 'fs';
import path from 'path';

try {
  // This will print the exact contents of your checkin folder to the Vercel log
  const dirPath = path.resolve(process.cwd(), 'app/checkin/[eventId]');
  console.log("=== DEBUG: FILES IN [eventId] FOLDER ===", fs.readdirSync(dirPath));
} catch (e) {
  console.log("=== DEBUG: COULD NOT READ FOLDER ===", e.message);
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* your existing config config options here */
};

export default nextConfig;