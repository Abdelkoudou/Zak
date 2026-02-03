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

      for await (const line of rl) {
        // CREATE TABLE "public"."users" (
        const tableMatch = line.match(/^CREATE TABLE "([^"]+)"\."([^"]+)" \(/);
        if (tableMatch) {
          currentTable = `${tableMatch[1]}.${tableMatch[2]}`;
          tables[currentTable] = [];
          continue;
        }

        if (currentTable && line.startsWith(');')) {
          currentTable = null;
          continue;
        }

        if (currentTable) {
          // "id" uuid DEFAULT ...
          const colMatch = line.match(/^\s+"([^"]+)"\s+([^,\s]+)/);
          if (colMatch) {
            tables[currentTable].push({ col: colMatch[1], type: colMatch[2] });
          }
        }

        // ALTER TABLE ONLY "public"."questions" ADD CONSTRAINT ... FOREIGN KEY ("module_id") REFERENCES "public"."modules"("id");
        const relMatch = line.match(/ALTER TABLE ONLY "([^"]+)"\."([^"]+)" .* FOREIGN KEY \("([^"]+)"\) REFERENCES "([^"]+)"\."([^"]+)"\("([^"]+)"\)/);
        if (relMatch) {
          relations.push({
            from: `${relMatch[1]}.${relMatch[2]}`,
            to: `${relMatch[4]}.${relMatch[5]}`,
            label: relMatch[3]
          });
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

    const tables: {schema: string, table: string}[] = [];
    let currentTable: {schema: string, table: string, columns: string[]} | null = null;
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
