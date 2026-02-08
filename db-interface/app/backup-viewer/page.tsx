"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Database,
  FileText,
  ArrowLeft,
  Download,
  Search,
  Table as TableIcon,
  Layout,
  Clock,
  HardDrive,
  ChevronRight,
  Filter,
  AlertCircle
} from "lucide-react";

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
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

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
    <div className="min-h-screen bg-theme-main text-theme-main font-body selection:bg-primary/20 p-4 md:p-8">
      <div className="max-w-[1600px] mx-auto space-y-8">
        {/* Header Section */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden bg-theme-card rounded-[1.5rem] md:rounded-[2rem] border border-theme shadow-2xl p-6 md:p-10"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/5 rounded-full -ml-24 -mb-24 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4 md:gap-6">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                className="w-12 h-12 md:w-16 md:h-16 bg-primary/10 rounded-xl md:rounded-2xl flex items-center justify-center text-primary shadow-inner border border-primary/20 shrink-0"
              >
                <Database size={24} className="md:w-8 md:h-8" strokeWidth={2.5} />
              </motion.div>
              <div>
                <h1 className="text-2xl md:text-4xl font-black font-heading tracking-tight text-theme-main leading-tight">
                  Visualiseur de Backup
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  <p className="text-theme-muted text-[10px] md:text-sm font-semibold uppercase tracking-widest opacity-80 truncate max-w-[200px] md:max-w-none">
                    {selectedFile ? selectedFile : "Sélectionnez un dump SQL pour explorer vos données"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <AnimatePresence mode="wait">
                {selectedFile && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex p-1 bg-theme-secondary/50 rounded-xl md:rounded-2xl border border-theme shadow-sm backdrop-blur-md overflow-hidden"
                  >
                    <button
                      className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black transition-all duration-300 ${viewMode === "data"
                        ? "bg-primary text-white shadow-lg shadow-primary/30"
                        : "text-theme-muted hover:text-theme-main"
                        }`}
                      onClick={() => setViewMode("data")}
                    >
                      <TableIcon size={12} className="md:w-3.5 md:h-3.5" />
                      DONNÉES
                    </button>
                    <button
                      className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black transition-all duration-300 ${viewMode === "schema"
                        ? "bg-primary text-white shadow-lg shadow-primary/30"
                        : "text-theme-muted hover:text-theme-main"
                        }`}
                      onClick={() => setViewMode("schema")}
                    >
                      <Layout size={12} className="md:w-3.5 md:h-3.5" />
                      SCHÉMA
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-2">
                {selectedFile && (
                  <button
                    className="lg:hidden p-3 bg-theme-card text-theme-main rounded-xl border border-theme shadow-sm"
                    onClick={() => setShowMobileSidebar(!showMobileSidebar)}
                  >
                    <Filter size={18} className={showMobileSidebar ? "text-primary" : "text-theme-muted"} />
                  </button>
                )}

                <AnimatePresence>
                  {selectedFile && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 md:px-6 py-2.5 md:py-3 bg-theme-card hover:bg-theme-secondary text-theme-main rounded-xl md:rounded-2xl border border-theme transition-all duration-200 flex items-center gap-2 md:gap-3 font-black text-xs md:text-sm shadow-sm hover:shadow-md"
                      onClick={() => {
                        setSelectedFile(null);
                        setSelectedTable(null);
                        setShowMobileSidebar(false);
                      }}
                    >
                      <ArrowLeft strokeWidth={3} className="text-primary w-3.5 h-3.5 md:w-4 md:h-4" />
                      <span className="hidden sm:inline">Retour</span>
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.header>

        <AnimatePresence mode="wait">
          {!selectedFile ? (
            <motion.div
              key="backups-grid"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {backups.map((file, idx) => (
                <motion.div
                  key={file.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="group relative bg-theme-card p-10 rounded-[2.5rem] border border-theme hover:border-primary/50 shadow-lg hover:shadow-2xl cursor-pointer transition-all duration-500 overflow-hidden"
                  onClick={() => setSelectedFile(file.name)}
                >
                  <div className="absolute -right-4 -top-4 text-primary/5 group-hover:text-primary/10 transition-colors duration-500 transform scale-150 rotate-12">
                    <FileText size={120} strokeWidth={1} />
                  </div>

                  <div className="relative z-10 flex flex-col gap-8">
                    <div className="w-16 h-16 bg-theme-secondary/80 rounded-2xl flex items-center justify-center text-primary shadow-sm border border-theme group-hover:bg-primary group-hover:text-white transition-all duration-500 group-hover:rotate-6">
                      <HardDrive size={32} />
                    </div>

                    <div>
                      <h3 className="font-black font-heading text-2xl mb-3 tracking-tight group-hover:text-primary transition-colors duration-300">
                        {file.name}
                      </h3>

                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-theme-main rounded-xl border border-theme text-xs font-bold text-theme-secondary">
                          <Database size={12} className="text-primary" />
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-theme-main rounded-xl border border-theme text-xs font-bold text-theme-secondary">
                          <Clock size={12} className="text-secondary" />
                          {new Date(file.mtime).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center text-primary font-black text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-[-10px] group-hover:translate-x-0">
                      Explorer le contenu <ChevronRight size={14} className="ml-1" />
                    </div>
                  </div>
                </motion.div>
              ))}

              {backups.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full bg-theme-card/50 backdrop-blur-sm py-32 rounded-[3rem] border-4 border-dashed border-theme flex flex-col items-center justify-center text-center"
                >
                  <div className="w-24 h-24 bg-theme-secondary rounded-full flex items-center justify-center mb-8 opacity-20">
                    <Search size={48} />
                  </div>
                  <h2 className="text-2xl font-black font-heading mb-2">Aucun backup trouvé</h2>
                  <p className="text-theme-muted font-bold max-w-md">
                    Vérifiez que vos fichiers .sql sont présents dans le dossier <code className="bg-theme-main px-2 py-0.5 rounded text-primary">/backups</code> à la racine.
                  </p>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="viewer-content"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-12 gap-8 items-stretch"
            >
              {/* Sidebar - Tables List */}
              <motion.aside
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className={`${showMobileSidebar ? 'flex' : 'hidden lg:flex'} col-span-12 lg:col-span-3 bg-theme-card rounded-[2rem] lg:rounded-[2.5rem] border border-theme shadow-xl flex-col h-[calc(100vh-320px)] md:h-[calc(100vh-280px)] overflow-hidden transition-all duration-300`}
              >
                <div className="p-8 border-b border-theme bg-gradient-to-br from-theme-card to-theme-secondary/20">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3 font-black font-heading text-xl">
                      <TableIcon className="text-primary" size={20} />
                      <span>Tables</span>
                    </div>
                    <motion.div
                      key={filteredTablesList.length}
                      initial={{ scale: 0.5 }}
                      animate={{ scale: 1 }}
                      className="px-3 py-1 bg-primary text-white text-[10px] font-black rounded-full shadow-lg shadow-primary/20"
                    >
                      {filteredTablesList.length}
                    </motion.div>
                  </div>

                  <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-muted group-focus-within:text-primary transition-colors" size={16} />
                    <input
                      placeholder="Rechercher une table..."
                      className="w-full pl-12 pr-4 py-3.5 text-sm bg-theme-main border border-theme rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none text-theme-main font-bold shadow-inner transition-all"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="overflow-y-auto flex-1 p-4 space-y-2 scrollbar-thin">
                  {filteredTablesList.map((t, idx) => (
                    <motion.button
                      key={`${t.schema}.${t.table}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + (idx * 0.03) }}
                      className={`w-full text-left px-5 py-4 rounded-2xl text-sm transition-all duration-300 group relative overflow-hidden ${selectedTable === `${t.schema}.${t.table}`
                        ? "bg-primary text-white shadow-xl shadow-primary/20"
                        : "hover:bg-theme-secondary/50 text-theme-secondary hover:text-theme-main border border-transparent hover:border-theme"
                        }`}
                      onClick={() => setSelectedTable(`${t.schema}.${t.table}`)}
                    >
                      <div className="relative z-10">
                        <span className={`block text-[9px] uppercase font-black tracking-[0.15em] mb-1.5 opacity-60 ${selectedTable === `${t.schema}.${t.table}` ? "text-white" : "text-primary"}`}>
                          {t.schema}
                        </span>
                        <span className="font-black text-base truncate block">{t.table}</span>
                      </div>
                    </motion.button>
                  ))}

                  {filteredTablesList.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-theme-muted opacity-30">
                      <Search size={40} className="mb-4" />
                      <p className="text-xs font-black uppercase tracking-widest">Aucun résultat</p>
                    </div>
                  )}
                </div>
              </motion.aside>

              {/* Main Content Area */}
              <motion.main
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className={`${showMobileSidebar ? 'hidden lg:flex' : 'flex'} col-span-12 lg:col-span-9 bg-theme-card rounded-[2rem] lg:rounded-[2.5rem] border border-theme shadow-xl flex flex-col h-[calc(100vh-320px)] md:h-[calc(100vh-280px)] overflow-hidden transition-all duration-300`}
              >
                {viewMode === "data" ? (
                  <>
                    <div className="px-6 md:px-8 py-4 md:py-6 border-b border-theme bg-gradient-to-r from-theme-card to-theme-secondary/10 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                      <div>
                        <motion.h3
                          key={selectedTable || "none"}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="font-black font-heading text-lg md:text-2xl flex items-center gap-3 md:gap-4"
                        >
                          <div className="p-1.5 md:p-2 bg-primary/10 rounded-lg text-primary shrink-0">
                            <TableIcon size={18} className="md:w-5 md:h-5" />
                          </div>
                          <span className="truncate max-w-[200px] md:max-w-none">
                            {selectedTable || "Explorer les données"}
                          </span>
                        </motion.h3>
                        {tableData && (
                          <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.8 }}
                            className="text-theme-muted text-[10px] md:text-[11px] font-black mt-1 md:mt-2 uppercase tracking-[0.1em] md:tracking-[0.2em] flex items-center gap-2"
                          >
                            <span className="h-1 w-1 md:h-1.5 md:w-1.5 rounded-full bg-secondary" />
                            {filteredRows.length} / {tableData.rows.length} records
                          </motion.p>
                        )}
                      </div>
                      {tableData && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex items-center justify-center gap-3 px-4 md:px-6 py-2.5 md:py-3 bg-secondary text-white hover:bg-secondary/90 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest transition-all shadow-lg shadow-secondary/20 shrink-0"
                          onClick={() => console.log("Exporting...")}
                        >
                          <Download size={14} className="md:w-4 md:h-4" />
                          Exporter
                        </motion.button>
                      )}
                    </div>

                    <div className="overflow-auto flex-1 relative scrollbar-thin">
                      {loading ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex flex-col items-center justify-center h-full gap-8 bg-theme-main/10"
                        >
                          <div className="relative">
                            <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin shadow-xl"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Database size={24} className="text-primary animate-pulse" />
                            </div>
                          </div>
                          <div className="text-center">
                            <p className="text-theme-main font-black text-lg font-heading tracking-tight">Traitement du backup...</p>
                            <p className="text-theme-muted font-bold text-xs uppercase tracking-widest mt-1">Extraction des données SQL en cours</p>
                          </div>
                        </motion.div>
                      ) : tableData ? (
                        <div className="relative min-w-full inline-block align-middle">
                          <table className="w-full text-sm text-left border-separate border-spacing-0">
                            <thead className="sticky top-0 z-30">
                              <tr className="bg-theme-main/95 backdrop-blur-md border-b border-theme shadow-sm">
                                {tableData.columns.map((col) => (
                                  <th
                                    key={col}
                                    className="px-4 md:px-8 py-4 md:py-6 border-b border-theme first:rounded-tl-2xl min-w-[200px] md:min-w-[240px] align-top transition-colors group"
                                  >
                                    <div className="flex flex-col gap-4">
                                      <div className="flex items-center justify-between">
                                        <span className="font-black font-heading text-xs uppercase tracking-[0.1em] text-primary block truncate max-w-[180px]" title={col}>
                                          {col}
                                        </span>
                                        <Filter size={12} className="text-theme-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                                      </div>
                                      <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted opacity-40" size={12} />
                                        <input
                                          type="text"
                                          placeholder="Filtrer..."
                                          className="w-full pl-9 pr-3 py-2 bg-theme-secondary/50 border border-theme rounded-xl text-[11px] font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary/40 outline-none transition-all placeholder:text-theme-muted/50"
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
                            <tbody className="divide-y divide-theme/50">
                              {filteredRows.map((row, i) => (
                                <motion.tr
                                  key={i}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: Math.min(i * 0.01, 0.5) }}
                                  className="hover:bg-primary/[0.02] transition-colors group cursor-default"
                                >
                                  {row.map((cell, j) => (
                                    <td
                                      key={j}
                                      className="px-4 md:px-8 py-4 md:py-5 text-theme-secondary font-medium group-hover:text-theme-main border-r border-theme/30 last:border-r-0"
                                    >
                                      {cell === "\\N" ? (
                                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-destructive/5 text-destructive border border-destructive/10 rounded-md text-[9px] font-black uppercase tracking-tighter">
                                          <AlertCircle size={10} />
                                          NULL
                                        </div>
                                      ) : (
                                        <span className="break-all line-clamp-2 hover:line-clamp-none transition-all duration-300">
                                          {cell}
                                        </span>
                                      )}
                                    </td>
                                  ))}
                                </motion.tr>
                              ))}
                            </tbody>
                          </table>

                          {filteredRows.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-40 bg-theme-main/5">
                              <div className="w-20 h-20 bg-theme-secondary rounded-[2rem] flex items-center justify-center text-theme-muted mb-6 transform rotate-12">
                                <Search size={32} />
                              </div>
                              <h4 className="font-black font-heading text-xl mb-1">Aucune correspondance</h4>
                              <p className="text-theme-muted text-xs font-bold uppercase tracking-widest">Modifiez vos filtres pour voir les résultats</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center p-12 gap-8">
                          <div className="relative">
                            <motion.div
                              animate={{ y: [0, -10, 0] }}
                              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                              className="w-32 h-32 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-[3rem] items-center justify-center flex shadow-inner"
                            >
                              <Layout size={48} className="text-primary opacity-30" />
                            </motion.div>
                            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-white rounded-2xl shadow-xl flex items-center justify-center border border-theme rotate-12">
                              <TableIcon size={20} className="text-secondary" />
                            </div>
                          </div>
                          <div>
                            <p className="font-black font-heading text-xl text-theme-main mb-2">Sélectionnez une table</p>
                            <p className="text-theme-muted font-bold text-sm max-w-xs">Choisissez une table dans la liste latérale pour explorer son contenu complet.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Schema View Content stays mostly the same but with motion entrance */}
                    <div className="px-6 md:px-8 py-4 md:py-6 border-b border-theme bg-gradient-to-r from-theme-card to-theme-secondary/10 flex justify-between items-center gap-4">
                      <h3 className="font-black font-heading text-lg md:text-2xl flex items-center gap-3 md:gap-4 truncate">
                        <div className="p-1.5 md:p-2 bg-secondary/10 rounded-lg text-secondary shrink-0">
                          <Layout size={18} className="md:w-5 md:h-5" />
                        </div>
                        <span className="truncate">Schéma</span>
                      </h3>
                      <div className="px-3 md:px-4 py-1.5 bg-theme-secondary rounded-lg md:rounded-xl border border-theme text-[9px] md:text-[10px] font-black uppercase tracking-widest text-theme-secondary shrink-0">
                        Modèle
                      </div>
                    </div>

                    <div className="flex-1 overflow-auto bg-theme-main/30 p-8 scrollbar-thin">
                      {loading ? (
                        <div className="flex items-center justify-center h-full">
                          <div className="w-16 h-16 border-4 border-secondary/20 border-t-secondary rounded-full animate-spin"></div>
                        </div>
                      ) : schemaInfo ? (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="space-y-12"
                        >
                          <div className="bg-theme-card p-6 md:p-10 rounded-[2rem] lg:rounded-[2.5rem] border border-theme shadow-lg font-mono text-[9px] md:text-xs overflow-auto max-h-[400px] md:max-h-[500px] border-l-4 border-l-primary relative">
                            <div className="absolute top-4 right-6 md:right-8 text-primary/20 text-[8px] md:text-[10px] uppercase font-black tracking-widest">DUMP STRUCTURE</div>
                            <pre className="text-theme-secondary leading-relaxed">
                              {`erDiagram
${Object.keys(schemaInfo?.tables || {}).length > 0
                                  ? Object.keys(schemaInfo.tables)
                                    .map((t) => {
                                      const tableName = t.includes('.') ? t.split(".")[1] : t;
                                      return `  ${tableName} {
${schemaInfo.tables[t]
                                          .slice(0, 8)
                                          .map((c) => `    ${c.type} ${c.col}`)
                                          .join("\n")}
  }`;
                                    })
                                    .join("\n")
                                  : "  %% No tables found"}
${(schemaInfo?.relations || [])
                                  .map((r) => {
                                    const from = r.from.includes('.') ? r.from.split(".")[1] : r.from;
                                    const to = r.to.includes('.') ? r.to.split(".")[1] : r.to;
                                    return `  ${from} ||--o{ ${to} : "${r.label}"`;
                                  })
                                  .join("\n")}`}
                            </pre>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {Object.entries(schemaInfo?.tables || {}).map(([tableName, cols], idx) => (
                              <motion.div
                                key={tableName}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-theme-card p-6 rounded-[2rem] border border-theme shadow-md hover:shadow-2xl transition-all duration-500 group"
                              >
                                <div className="flex items-center gap-3 mb-6 border-b border-theme pb-4">
                                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                    <TableIcon size={14} />
                                  </div>
                                  <h4 className="font-black font-heading text-sm uppercase tracking-tight text-theme-main truncate">
                                    {tableName}
                                  </h4>
                                </div>
                                <div className="space-y-3">
                                  {cols.map((c) => (
                                    <div
                                      key={c.col}
                                      className="flex justify-between items-center group-hover:translate-x-1 transition-transform duration-300"
                                    >
                                      <span className="text-theme-secondary font-bold text-[11px]">
                                        {c.col}
                                      </span>
                                      <span className="px-2 py-0.5 bg-theme-secondary rounded-lg text-[9px] font-black text-primary border border-theme">
                                        {c.type}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            ),
                            )}
                          </div>
                        </motion.div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-theme-muted gap-6">
                          <div className="w-20 h-20 bg-theme-secondary/50 rounded-[2rem] flex items-center justify-center text-red-500/50">
                            <AlertCircle size={40} />
                          </div>
                          <p className="font-black font-heading text-xl">Schéma non disponible</p>
                          <p className="text-sm font-bold max-w-xs text-center">Les métadonnées du schéma n&apos;ont pas pu être extraites de ce fichier backup.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.main>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
