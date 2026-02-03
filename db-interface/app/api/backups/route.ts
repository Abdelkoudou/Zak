import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const backupDir = path.join(process.cwd(), '..', 'backups');
    
    if (!fs.existsSync(backupDir)) {
      return NextResponse.json([]);
    }

    const files = fs.readdirSync(backupDir);
    const sqlFiles = files
      .filter(f => f.endsWith('.sql'))
      .map(f => {
        const filePath = path.join(backupDir, f);
        const stats = fs.statSync(filePath);
        return {
          name: f,
          size: stats.size,
          mtime: stats.mtime
        };
      })
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    return NextResponse.json(sqlFiles);
  } catch (error) {
    console.error("Error listing backups:", error);
    return NextResponse.json({ error: "Failed to list backups" }, { status: 500 });
  }
}
