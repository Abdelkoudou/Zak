"use client";

import { useState, useEffect, useMemo } from "react";

interface BackupFile {
  name: string;
  size: number;
  mtime: string;
}

interface TableData {
  schema: string;
  table: string;
  columns: string[];
  rows: string[][];
}

interface SchemaInfo {
  tables: Record<string, { col: string; type: string }[]>;
  relations: { from: string; to: string; label: string }[];
}

export default function BackupViewerPage() {
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [tables, setTables] = useState<{ schema: string; table: string }[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"data" | "schema">("data");
  const [schemaInfo, setSchemaInfo] = useState<SchemaInfo | null>(null);

  // Filtering state
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>(
    {},
  );

  // Fetch list of backups
  useEffect(() => {
    async function fetchBackups() {
      try {
        const res = await fetch("/api/backups");
        const data = await res.json();
        setBackups(data);
      } catch (err) {
        console.error("Failed to fetch backups:", err);
      }
    }
    fetchBackups();
  }, []);

  // Fetch tables from a selected file
  useEffect(() => {
    if (!selectedFile) return;

    async function fetchTables() {
      setLoading(true);
      try {
        const res = await fetch(`/api/backups/parse?file=${selectedFile}`);
        const data = await res.json();
        setTables(data.tables || []);
        setSelectedTable(null);
        setTableData(null);
        setColumnFilters({});
      } catch (err) {
        console.error("Failed to fetch tables:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTables();
  }, [selectedFile]);

  // Fetch data for a selected table
  useEffect(() => {
    if (!selectedFile || !selectedTable || viewMode !== "data") return;

    async function fetchTableData() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/backups/parse?file=${selectedFile}&table=${selectedTable}`,
        );
        const data = await res.json();
        setTableData(data.tableData);
        setColumnFilters({});
      } catch (err) {
        console.error("Failed to fetch table data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchTableData();
  }, [selectedFile, selectedTable, viewMode]);

  // Fetch schema diagram info
  useEffect(() => {
    if (!selectedFile || viewMode !== "schema") return;

    async function fetchSchema() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/backups/parse?file=${selectedFile}&type=schema_diagram`,
        );
        const data = await res.json();
        setSchemaInfo(data);
      } catch (err) {
        console.error("Failed to fetch schema info:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSchema();
  }, [selectedFile, viewMode]);

  const filteredTablesList = tables.filter((t) =>
    `${t.schema}.${t.table}`.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredRows = useMemo(() => {
    if (!tableData) return [];
    return tableData.rows.filter((row) => {
      return Object.entries(columnFilters).every(([col, filter]) => {
        if (!filter) return true;
        const colIndex = tableData.columns.indexOf(col);
        if (colIndex === -1) return true;
        const value = row[colIndex] || "";
        return value.toLowerCase().includes(filter.toLowerCase());
      });
    });
  }, [tableData, columnFilters]);

  const handleFilterChange = (col: string, val: string) => {
    setColumnFilters((prev) => ({ ...prev, [col]: val }));
  };

  return (
    <div className="p-4 md:p-6 max-w-[1600px] mx-auto space-y-6 text-theme-main">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between bg-theme-card p-6 rounded-3xl border border-theme shadow-lg gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-3xl shadow-inner">
            💾
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black font-heading tracking-tight">
              Visualiseur de Backup
            </h1>
            <p className="text-theme-muted text-xs font-bold uppercase tracking-widest opacity-70">
              {selectedFile
                ? `Fichier: ${selectedFile}`
                : "Sélectionnez un dump SQL"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedFile && (
            <div className="flex p-1 bg-theme-secondary/50 rounded-xl border border-theme mr-2">
              <button
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === "data" ? "bg-primary text-white shadow-md" : "text-theme-muted hover:text-theme-main"}`}
                onClick={() => setViewMode("data")}
              >
                DONNÉES
              </button>
              <button
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === "schema" ? "bg-primary text-white shadow-md" : "text-theme-muted hover:text-theme-main"}`}
                onClick={() => setViewMode("schema")}
              >
                SCHÉMA
              </button>
            </div>
          )}
          {selectedFile && (
            <button
              className="px-5 py-2 bg-theme-secondary hover:bg-theme-secondary/80 text-theme-main rounded-xl border border-theme transition-all flex items-center gap-2 font-bold text-sm shadow-sm"
              onClick={() => setSelectedFile(null)}
            >
              <span>⬅️</span> Retour
            </button>
          )}
        </div>
      </div>

      {!selectedFile ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {backups.map((file) => (
            <div
              key={file.name}
              className="bg-theme-card p-8 rounded-3xl border border-theme hover:border-primary shadow-sm cursor-pointer transition-all hover:shadow-xl group relative overflow-hidden"
              onClick={() => setSelectedFile(file.name)}
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity text-6xl">
                {file.name.includes("data")
                  ? "📊"
                  : file.name.includes("schema")
                    ? "🏗️"
                    : "🔑"}
              </div>
              <div className="flex items-center gap-5 relative z-10">
                <div className="w-14 h-14 bg-theme-secondary rounded-2xl flex items-center justify-center text-3xl shadow-sm">
                  📄
                </div>
                <div>
                  <h3 className="font-black text-xl mb-1">{file.name}</h3>
                  <div className="flex items-center gap-3 text-sm font-bold text-theme-muted">
                    <span className="px-2 py-0.5 bg-theme-secondary rounded-lg border border-theme">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                    <span>•</span>
                    <span>{new Date(file.mtime).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {backups.length === 0 && (
            <div className="col-span-full bg-theme-card text-center text-theme-muted py-24 border-2 border-dashed border-theme rounded-3xl">
              <span className="text-6xl block mb-6 opacity-20">🔍</span>
              <p className="text-xl font-bold">Aucun backup trouvé</p>
              <p className="text-sm opacity-60">
                Vérifiez le dossier /backups à la racine du projet
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-6 items-start">
          {/* Sidebar - Tables List */}
          <div className="col-span-12 lg:col-span-3 bg-theme-card rounded-3xl border border-theme shadow-lg flex flex-col h-[calc(100vh-220px)] overflow-hidden">
            <div className="p-5 border-b border-theme bg-theme-secondary/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 font-black text-lg">
                  <span>📋</span> Tables
                </div>
                <span className="text-[10px] font-black px-2 py-1 bg-primary/10 text-primary rounded-full border border-primary/20">
                  {filteredTablesList.length} total
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-sm opacity-40">
                  🔍
                </span>
                <input
                  placeholder="Filtrer les tables..."
                  className="w-full pl-9 pr-4 py-2.5 text-sm bg-theme-secondary border border-theme rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none text-theme-main font-semibold shadow-inner"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-y-auto p-3 space-y-1.5 bg-theme-card/50">
              {filteredTablesList.map((t) => (
                <button
                  key={`${t.schema}.${t.table}`}
                  className={`w-full text-left px-4 py-3 rounded-2xl text-sm transition-all group ${
                    selectedTable === `${t.schema}.${t.table}`
                      ? "bg-primary text-white shadow-lg shadow-primary/30 border border-primary/50"
                      : "hover:bg-theme-secondary text-theme-secondary active:scale-[0.98]"
                  }`}
                  onClick={() => setSelectedTable(`${t.schema}.${t.table}`)}
                >
                  <span
                    className={`block text-[9px] uppercase font-black tracking-tighter mb-1 opacity-60 ${selectedTable === `${t.schema}.${t.table}` ? "text-white" : ""}`}
                  >
                    {t.schema}
                  </span>
                  <span className="font-bold truncate block">{t.table}</span>
                </button>
              ))}
              {filteredTablesList.length === 0 && (
                <div className="text-center py-10 opacity-40 flex flex-col items-center gap-2">
                  <span className="text-3xl text-theme-muted">🌫️</span>
                  <p className="text-xs font-bold uppercase tracking-widest">
                    Vide
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="col-span-12 lg:col-span-9 bg-theme-card rounded-3xl border border-theme shadow-lg flex flex-col h-[calc(100vh-220px)] overflow-hidden">
            {viewMode === "data" ? (
              <>
                <div className="p-5 border-b border-theme flex flex-col md:flex-row justify-between items-md-center gap-4 bg-theme-secondary/10">
                  <div>
                    <h3 className="font-black text-xl flex items-center gap-3">
                      <span>🗂️</span>{" "}
                      {selectedTable || "Sélectionnez une table"}
                    </h3>
                    {tableData && (
                      <p className="text-theme-muted text-xs font-bold mt-1 uppercase tracking-widest">
                        Affichage de {filteredRows.length} sur{" "}
                        {tableData.rows.length} lignes
                      </p>
                    )}
                  </div>
                  {tableData && (
                    <div className="flex gap-2">
                      <button
                        className="p-2 bg-theme-secondary hover:bg-theme-secondary/80 rounded-xl border border-theme text-sm"
                        title="Exporter CSV (Simulation)"
                      >
                        📥 CSV
                      </button>
                    </div>
                  )}
                </div>

                <div className="overflow-auto flex-1 bg-theme-main/[0.02]">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-5">
                      <div className="w-14 h-14 border-4 border-primary/10 border-t-primary rounded-full animate-spin shadow-lg"></div>
                      <p className="text-theme-muted font-black text-sm uppercase tracking-widest animate-pulse">
                        Extraction en cours...
                      </p>
                    </div>
                  ) : tableData ? (
                    <div className="relative min-w-full">
                      <table className="w-full text-sm text-left border-collapse table-fixed">
                        <thead className="sticky top-0 z-20">
                          <tr className="bg-theme-secondary/90 backdrop-blur-xl border-b border-theme shadow-sm">
                            {tableData.columns.map((col) => (
                              <th
                                key={col}
                                className="px-6 py-4 border-r border-theme last:border-r-0 min-w-[200px] align-top"
                              >
                                <div className="flex flex-col gap-2">
                                  <span
                                    className="font-black text-[11px] uppercase tracking-wider text-theme-main/80 block mb-1 truncate"
                                    title={col}
                                  >
                                    {col}
                                  </span>
                                  <div className="relative">
                                    <span className="absolute left-2 top-2 text-[10px] opacity-30">
                                      🔍
                                    </span>
                                    <input
                                      type="text"
                                      placeholder="Filtrer..."
                                      className="w-full pl-6 pr-2 py-1.5 bg-theme-card/50 border border-theme rounded-lg text-[10px] focus:ring-1 focus:ring-primary/50 outline-none font-bold"
                                      value={columnFilters[col] || ""}
                                      onChange={(e) =>
                                        handleFilterChange(col, e.target.value)
                                      }
                                    />
                                  </div>
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-theme">
                          {filteredRows.map((row, i) => (
                            <tr
                              key={i}
                              className="hover:bg-primary/[0.03] transition-colors group"
                            >
                              {row.map((cell, j) => (
                                <td
                                  key={j}
                                  className="px-6 py-3 border-r border-theme last:border-r-0 truncate text-theme-secondary font-medium group-hover:text-primary transition-colors"
                                >
                                  {cell === "\\N" ? (
                                    <span className="text-[9px] font-black px-1.5 py-0.5 bg-red-500/10 text-red-500/80 rounded uppercase border border-red-500/10">
                                      NULL
                                    </span>
                                  ) : (
                                    cell
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                          {filteredRows.length === 0 && (
                            <tr>
                              <td
                                colSpan={tableData.columns.length}
                                className="px-6 py-32 text-center text-theme-muted"
                              >
                                <div className="flex flex-col items-center gap-4">
                                  <span className="text-6xl opacity-10">
                                    🌫️
                                  </span>
                                  <p className="font-black text-lg">
                                    Aucun résultat
                                  </p>
                                  <p className="text-xs uppercase font-bold tracking-widest opacity-60">
                                    Ajustez vos filtres de recherche
                                  </p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-theme-muted gap-6">
                      <div className="w-20 h-20 bg-theme-secondary/30 rounded-3xl flex items-center justify-center text-5xl shadow-inner opacity-20">
                        📂
                      </div>
                      <p className="font-black text-sm uppercase tracking-[0.2em] opacity-50">
                        Sélectionnez une table à gauche
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col">
                <div className="p-5 border-b border-theme bg-theme-secondary/10 flex justify-between items-center">
                  <h3 className="font-black text-xl flex items-center gap-3">
                    <span>🏗️</span> Diagramme du Schéma (Mermaid)
                  </h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-theme-muted">
                    Relations extraites de schema.sql
                  </p>
                </div>
                <div className="flex-1 p-6 overflow-auto bg-theme-main/[0.04]">
                  {loading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="w-14 h-14 border-4 border-primary/10 border-t-primary rounded-full animate-spin"></div>
                    </div>
                  ) : schemaInfo ? (
                    <div className="space-y-12 pb-12">
                      <div className="bg-theme-card p-6 rounded-3xl border border-theme shadow-inner font-mono text-[11px] overflow-auto max-h-[400px]">
                        <pre className="text-primary-600">
                          {`erDiagram
${Object.keys(schemaInfo.tables)
  .map(
    (t) => `  ${t.split(".")[1]} {
${schemaInfo.tables[t]
  .slice(0, 10)
  .map((c) => `    ${c.type} ${c.col}`)
  .join("\n")}
  }`,
  )
  .join("\n")}
${schemaInfo.relations.map((r) => `  ${r.from.split(".")[1]} ||--o{ ${r.to.split(".")[1]} : "${r.label}"`).join("\n")}`}
                        </pre>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {Object.entries(schemaInfo.tables).map(
                          ([tableName, cols]) => (
                            <div
                              key={tableName}
                              className="bg-theme-card p-4 rounded-2xl border border-theme shadow-sm hover:shadow-md transition-all"
                            >
                              <h4 className="font-black text-xs uppercase tracking-tighter text-primary truncate mb-3 border-b border-theme pb-2">
                                {tableName}
                              </h4>
                              <div className="space-y-1">
                                {cols.map((c) => (
                                  <div
                                    key={c.col}
                                    className="flex justify-between items-center text-[10px] font-bold"
                                  >
                                    <span className="text-theme-secondary">
                                      {c.col}
                                    </span>
                                    <span className="px-1.5 py-0.5 bg-theme-secondary rounded text-[9px] opacity-70">
                                      {c.type}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-theme-muted gap-4">
                      <span className="text-5xl opacity-10">🏗️</span>
                      <p className="font-medium text-sm">
                        Impossible de générer le schéma
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
