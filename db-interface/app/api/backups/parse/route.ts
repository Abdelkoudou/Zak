import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fileName = searchParams.get('file');
  const tableFilter = searchParams.get('table'); // format: "schema.table"
  const type = searchParams.get('type') || 'data'; // 'data' or 'schema'

  if (!fileName) {
    return NextResponse.json({ error: "Missing file parameter" }, { status: 400 });
  }

  try {
    const backupDir = path.join(process.cwd(), '..', 'backups');
    const filePath = path.join(backupDir, fileName);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    if (type === 'schema_diagram') {
      // Parse schema.sql to build a mermaid diagram or relationship map
      const schemaPath = path.join(backupDir, 'schema.sql');
      if (!fs.existsSync(schemaPath)) {
        return NextResponse.json({ error: "schema.sql not found for diagram" }, { status: 404 });
      }

      const rl = readline.createInterface({
        input: fs.createReadStream(schemaPath),
        crlfDelay: Infinity
      });

      const tables: Record<string, { col: string, type: string }[]> = {};
      const relations: { from: string, to: string, label: string }[] = [];
      let currentTable: string | null = null;
      let lastAlterTable: string | null = null;

      for await (const line of rl) {
        const trimmedLine = line.trim();

        // Match: CREATE TABLE IF NOT EXISTS "public"."users" (
        // or: CREATE TABLE "public"."users" (
        const tableMatch = trimmedLine.match(/^CREATE TABLE (?:IF NOT EXISTS )?"([^"]+)"\."([^"]+)" \(/i);
        if (tableMatch) {
          currentTable = `${tableMatch[1]}.${tableMatch[2]}`;
          tables[currentTable] = [];
          continue;
        }

        if (currentTable && (trimmedLine === ');' || trimmedLine.startsWith(');'))) {
          currentTable = null;
          continue;
        }

        if (currentTable) {
          // Match: "id" uuid DEFAULT ...
          const colMatch = trimmedLine.match(/^"([^"]+)"\s+([^,\s\)]+)/);
          if (colMatch) {
            tables[currentTable].push({
              col: colMatch[1],
              type: colMatch[2].replace(/"/g, '')
            });
          }
        }

        // Handle multi-line ALTER TABLE statements
        const alterTableMatch = trimmedLine.match(/^ALTER TABLE (?:ONLY )?"([^"]+)"\."([^"]+)"/i);
        if (alterTableMatch) {
          lastAlterTable = `${alterTableMatch[1]}.${alterTableMatch[2]}`;
        }

        // Match: ADD CONSTRAINT ... FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id");
        // or merged: ALTER TABLE ONLY "public"."questions" ADD CONSTRAINT ... FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id");
        const relMatch = trimmedLine.match(/(?:ADD CONSTRAINT .* )?FOREIGN KEY \("([^"]+)"\) REFERENCES "([^"]+)"\."([^"]+)"\("([^"]+)"\)/i);
        if (relMatch && (lastAlterTable || trimmedLine.match(/ALTER TABLE/i))) {
          let fromTable = lastAlterTable;

          if (trimmedLine.match(/ALTER TABLE (?:ONLY )?"([^"]+)"\."([^"]+)"/i)) {
            const m = trimmedLine.match(/ALTER TABLE (?:ONLY )?"([^"]+)"\."([^"]+)"/i);
            if (m) fromTable = `${m[1]}.${m[2]}`;
          }

          if (fromTable) {
            relations.push({
              from: fromTable,
              to: `${relMatch[2]}.${relMatch[3]}`,
              label: relMatch[1]
            });
          }
        }

        // Reset alter table if we move to a different statement
        if (trimmedLine.endsWith(';')) {
          lastAlterTable = null;
        }
      }

      return NextResponse.json({ tables, relations });
    }

    // Default: Parse data from the selected file
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    const tables: { schema: string, table: string }[] = [];
    let currentTable: { schema: string, table: string, columns: string[] } | null = null;
    let inDataSection = false;
    const tableDataRows: string[][] = [];

    for await (const line of rl) {
      if (line.startsWith('COPY ')) {
        const parts = line.match(/COPY\s+"([^"]+)"\."([^"]+)"\s+\(([^)]+)\)\s+FROM stdin;/);
        if (parts) {
          const schema = parts[1];
          const table = parts[2];
          const columns = parts[3].split(',').map(c => c.trim().replace(/"/g, ''));

          const fullTableName = `${schema}.${table}`;
          tables.push({ schema, table });

          if (tableFilter === fullTableName) {
            currentTable = { schema, table, columns };
            inDataSection = true;
          }
        }
        continue;
      }

      if (inDataSection) {
        if (line === '\\.') {
          inDataSection = false;
          if (tableFilter) break;
          continue;
        }

        if (currentTable) {
          tableDataRows.push(line.split('\t'));
        }
      }
    }

    return NextResponse.json({
      tables,
      tableData: currentTable ? {
        ...currentTable,
        rows: tableDataRows
      } : null
    });

  } catch (error) {
    console.error("Error parsing backup:", error);
    return NextResponse.json({ error: "Failed to parse backup" }, { status: 500 });
  }
}
