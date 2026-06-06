import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  PlayCircle, StopCircle, Thermometer, Droplets, AlertTriangle,
  Download, Search, ChevronDown, Filter, FileSpreadsheet
} from "lucide-react";
import { ThemeToggle } from '../components/ui/ThemeToggle';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { useLanguage } from '../contexts/LanguageContext';

interface LogEntry {
  id: string;
  type: "pump_on" | "pump_off" | "sensor_temp" | "sensor_rh" | "sensor_soil" | "alert_temp" | "alert_rh" | "sensor";
  title: string;
  detail: string;
  zone: string;
  operator: string;
  timestamp: string;
  date: string;
  rawDate: Date;
}

const LOG_ICONS: Record<LogEntry["type"], React.ReactNode> = {
  pump_on: <PlayCircle className="w-4 h-4 text-primary" />,
  pump_off: <StopCircle className="w-4 h-4 text-muted-foreground" />,
  sensor_temp: <Thermometer className="w-4 h-4 text-orange-500" />,
  sensor_rh: <Droplets className="w-4 h-4 text-emerald-500" />, // Changed from blue to emerald
  sensor_soil: <Droplets className="w-4 h-4 text-amber-600" />,
  alert_temp: <Thermometer className="w-4 h-4 text-chart-3" />,
  alert_rh: <Droplets className="w-4 h-4 text-chart-2" />,
  sensor: <AlertTriangle className="w-4 h-4 text-muted-foreground/60" />,
};

const LOG_BG: Record<LogEntry["type"], string> = {
  pump_on: "var(--color-secondary)",
  pump_off: "var(--color-secondary)",
  sensor_temp: "rgba(249, 115, 22, 0.1)",
  sensor_rh: "rgba(16, 185, 129, 0.1)", // Changed from blue background to emerald background
  sensor_soil: "rgba(217, 119, 6, 0.1)",
  alert_temp: "rgba(245, 158, 11, 0.1)",
  alert_rh: "rgba(107, 153, 200, 0.1)",
  sensor: "var(--color-card)",
};

type FilterType = "semua" | "pump" | "sensor_temp" | "sensor_rh";

export default function Logs() {
  const { t, lang } = useLanguage();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<FilterType>("semua");
  const [search, setSearch] = useState("");
  const [showExport, setShowExport] = useState(false);
  const [loading, setLoading] = useState(true);

  const isEn = lang === 'en';

  useEffect(() => {
    fetchLogs();

    const logsSub = supabase
      .channel('logs_page_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'pump_logs' }, () => {
        fetchLogs();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sensor_readings' }, () => {
        fetchLogs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(logsSub);
    };
    // Re-fetch when language changes so titles and dates are translated properly
  }, [lang]);

  const fetchLogs = async () => {
    setLoading(true);
    
    // 1. Fetch pump logs
    const { data: pumpData, error: pumpError } = await supabase
      .from('pump_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    // 2. Fetch sensor readings
    const { data: sensorData, error: sensorError } = await supabase
      .from('sensor_readings')
      .select('*')
      .order('recorded_at', { ascending: false })
      .limit(300);

    let allLogs: LogEntry[] = [];

    if (!pumpError && pumpData) {
      const formattedPump: LogEntry[] = pumpData.map((log: any) => {
        const d = new Date(log.created_at);
        const isToday = d.toDateString() === new Date().toDateString();
        const isYesterday = d.toDateString() === new Date(Date.now() - 86400000).toDateString();
        
        let dateLabel = d.toLocaleDateString(isEn ? 'en-US' : 'id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
        if (isToday) dateLabel = t('logs.today');
        if (isYesterday) dateLabel = t('logs.yesterday');

        const type: LogEntry['type'] = log.action === 'PUMP ON' ? 'pump_on' : 'pump_off';

        return {
          id: `pump-${log.id}`,
          type,
          title: log.action === 'PUMP ON' ? t('logs.pumpOn') : t('logs.pumpOff'),
          detail: log.detail || '-',
          zone: `${t('logs.zone')} ${log.zone}`,
          operator: log.operator || t('logs.system'),
          timestamp: d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }), // Keeping 24h format generally
          date: dateLabel,
          rawDate: d
        };
      });
      allLogs = [...allLogs, ...formattedPump];
    }

    if (!sensorError && sensorData) {
      const formattedSensor: LogEntry[] = sensorData
        .filter((log: any) => log.type !== 'pump')
        .map((log: any) => {
        const d = new Date(log.recorded_at);
        const isToday = d.toDateString() === new Date().toDateString();
        const isYesterday = d.toDateString() === new Date(Date.now() - 86400000).toDateString();
        
        let dateLabel = d.toLocaleDateString(isEn ? 'en-US' : 'id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
        if (isToday) dateLabel = t('logs.today');
        if (isYesterday) dateLabel = t('logs.yesterday');

        let type: LogEntry['type'] = 'sensor';
        let title = t('logs.sensorReading');
        let detail = `${log.value}`;
        
        if (log.type === 'temperature') {
          type = 'sensor_temp';
          title = t('logs.tempRecorded');
          detail = `${log.value} °C`;
        } else if (log.type === 'humidity') {
          type = 'sensor_rh';
          title = t('logs.rhRecorded');
          detail = `${log.value}%`;
        } else if (log.type === 'soil_moisture') {
          type = 'sensor_soil';
          title = t('logs.soilRecorded');
          detail = `${log.value}%`;
        }

        return {
          id: `sensor-${log.id}`,
          type,
          title,
          detail,
          zone: `${t('logs.zone')} ${log.zone || 'A'}`,
          operator: t('logs.system'),
          timestamp: d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          date: dateLabel,
          rawDate: d
        };
      });
      allLogs = [...allLogs, ...formattedSensor];
    }

    // Sort combined logs by date descending
    allLogs.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());
    
    setLogs(allLogs);
    setLoading(false);
  };

  const filtered = logs.filter((log) => {
    const matchFilter =
      filter === "semua" ||
      (filter === "pump" && (log.type === "pump_on" || log.type === "pump_off")) ||
      (filter === "sensor_temp" && log.type === "sensor_temp") ||
      (filter === "sensor_rh" && log.type === "sensor_rh");
      
    const matchSearch =
      !search ||
      log.title.toLowerCase().includes(search.toLowerCase()) ||
      log.detail.toLowerCase().includes(search.toLowerCase()) ||
      log.zone.toLowerCase().includes(search.toLowerCase()) ||
      log.operator.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const grouped = filtered.reduce<Record<string, LogEntry[]>>((acc, log) => {
    acc[log.date] = [...(acc[log.date] || []), log];
    return acc;
  }, {});

  const exportToCSV = () => {
    const headerRow = `${t('logs.colTime')},${t('logs.colDate')},${t('logs.colZone')},${t('logs.colActivity')},${t('logs.colDetail')}`;
    const csvStr = [headerRow].concat(
      filtered.map(l => `"${l.timestamp}","${l.date}","${l.zone}","${l.title}","${l.detail.replace(/"/g, '""')}"`)
    ).join('\n');
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const filename = isEn ? `History_${new Date().toISOString().slice(0, 10)}.csv` : `Riwayat_${new Date().toISOString().slice(0, 10)}.csv`;
    link.download = filename;
    link.click();
    setShowExport(false);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    const docTitle = t('logs.excelTitle');
    doc.text(docTitle, 14, 20);
    autoTable(doc, {
      head: [[t('logs.colTime'), t('logs.colDate'), t('logs.colZone'), t('logs.colActivity'), t('logs.colDetail')]],
      body: filtered.map(l => [l.timestamp, l.date, l.zone, l.title, l.detail]),
      startY: 30,
    });
    const filename = isEn ? `History_${new Date().toISOString().slice(0, 10)}.pdf` : `Riwayat_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
    setShowExport(false);
  };

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(isEn ? 'History' : 'Riwayat');

    // Add Title
    worksheet.mergeCells('A1', 'F1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = t('logs.excelTitle');
    titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF064E3B' } }; // Dark emerald green
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // Add generated date
    worksheet.mergeCells('A2', 'F2');
    const dateCell = worksheet.getCell('A2');
    dateCell.value = `${t('logs.printedOn')}: ${new Date().toLocaleString(isEn ? 'en-US' : 'id-ID')}`;
    dateCell.font = { name: 'Arial', size: 10, italic: true };
    dateCell.alignment = { vertical: 'middle', horizontal: 'right' };

    worksheet.addRow([]); // empty row

    // Define columns
    worksheet.columns = [
      { header: 'No', key: 'no', width: 6 },
      { header: t('logs.colDate'), key: 'tanggal', width: 15 },
      { header: t('logs.colTime'), key: 'waktu', width: 12 },
      { header: t('logs.colZone'), key: 'zona', width: 12 },
      { header: t('logs.colActivity'), key: 'aktivitas', width: 25 },
      { header: t('logs.colDetail'), key: 'detail', width: 35 },
      { header: 'Operator', key: 'operator', width: 15 },
    ];

    // Style header row
    const headerRow = worksheet.getRow(4);
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } }; // Emerald green
      cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
      };
    });
    headerRow.height = 25;

    // Add data
    filtered.forEach((log, index) => {
      const row = worksheet.addRow({
        no: index + 1,
        tanggal: log.rawDate.toLocaleDateString(isEn ? 'en-US' : 'id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        waktu: log.timestamp,
        zona: log.zone,
        aktivitas: log.title,
        detail: log.detail,
        operator: log.operator,
      });

      // Style data rows
      row.eachCell((cell, colNumber) => {
        cell.font = { name: 'Arial', size: 10 };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFEEEEEE' } },
          left: { style: 'thin', color: { argb: 'FFEEEEEE' } },
          bottom: { style: 'thin', color: { argb: 'FFEEEEEE' } },
          right: { style: 'thin', color: { argb: 'FFEEEEEE' } }
        };
        
        // Alignment
        if (colNumber === 1 || colNumber === 2 || colNumber === 3) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else {
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        }
      });
      
      // Alternate row colors for readability
      if (index % 2 === 0) {
        row.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } }; // Very light gray
        });
      }
    });

    // Save
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const filename = isEn ? `Verdanist_History_${new Date().toISOString().slice(0, 10)}.xlsx` : `Verdanist_Riwayat_${new Date().toISOString().slice(0, 10)}.xlsx`;
    saveAs(blob, filename);
    setShowExport(false);
  };

  return (
    <>
      <div className="flex flex-col min-h-[100dvh] bg-background pb-28">
        <div className="px-6 pt-14 pb-4">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h1 style={{ fontFamily: "'Fredoka', sans-serif", fontSize: 28, fontWeight: 600 }} className="text-foreground">
                {t('logs.title')}
              </h1>
              <p style={{ fontSize: 14 }} className="text-muted-foreground">{logs.length} {t('logs.records')}</p>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle className="w-10 h-10 bg-card border border-border" />
            </div>
          </div>
          <div className="flex items-center justify-end mt-2">
            <div className="relative">
              <button
                onClick={() => setShowExport(!showExport)}
                className="bg-card border border-border rounded-xl px-3 py-2 flex items-center gap-1.5 text-primary shadow-[var(--shadow-custom)]"
                style={{ fontSize: 13, fontWeight: 600 }}
              >
                <Download className="w-4 h-4" />
                {t('logs.export')}
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {showExport && (
                <div className="absolute right-0 top-full mt-2 bg-card border border-border rounded-2xl py-2 min-w-[170px] z-10 shadow-2xl">
                  <button onClick={exportToExcel} className="w-full text-left px-4 py-2.5 text-foreground hover:bg-secondary transition-colors flex items-center gap-2" style={{ fontSize: 14 }}>
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Excel (.xlsx)
                  </button>
                  <button onClick={exportToPDF} className="w-full text-left px-4 py-2.5 text-foreground hover:bg-secondary transition-colors flex items-center gap-2" style={{ fontSize: 14 }}>
                    📕 {t('logs.exportPDF')}
                  </button>
                  <button onClick={exportToCSV} className="w-full text-left px-4 py-2.5 text-foreground hover:bg-secondary transition-colors flex items-center gap-2" style={{ fontSize: 14 }}>
                    📄 {t('logs.exportCSV')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 mb-3">
          <div className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3.5 shadow-sm">
            <Search className="w-4 h-4 text-muted-foreground/60" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('logs.searchPlaceholder')}
              className="bg-transparent flex-1 text-foreground outline-none placeholder-muted-foreground/60"
              style={{ fontSize: 14 }}
            />
          </div>
        </div>

        <div className="px-6 mb-4 flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: "semua", label: t('logs.all') },
            { id: "pump", label: t('logs.pump') },
            { id: "sensor_temp", label: t('logs.temp') },
            { id: "sensor_rh", label: t('logs.hum') },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as FilterType)}
              className={`flex-shrink-0 px-4 py-2 rounded-full border transition-all ${
                filter === f.id
                  ? "bg-primary/10 border-primary/40 text-primary"
                  : "bg-card border-border text-muted-foreground shadow-sm"
              }`}
              style={{ fontSize: 13, fontWeight: 500 }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="px-6 space-y-6">
          {loading ? (
             <div className="text-center py-16 text-muted-foreground flex flex-col items-center">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-3"></div>
                {t('logs.loading')}
             </div>
          ) : Object.entries(grouped).map(([date, entries]) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-3">
                <span style={{ fontSize: 12, fontWeight: 600 }} className="text-muted-foreground/80 uppercase tracking-wide">{date}</span>
                <div className="flex-1 h-px bg-border" />
                <span style={{ fontSize: 11 }} className="text-muted-foreground/60">{entries.length} {t('logs.count')}</span>
              </div>
              <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden shadow-[var(--shadow-custom)]">
                {entries.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 px-4 py-3.5 hover:bg-secondary/50 transition-colors">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: LOG_BG[log.type] }}
                    >
                      {LOG_ICONS[log.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ fontSize: 13, fontWeight: 600 }} className="text-foreground">{log.title}</p>
                      <p style={{ fontSize: 11 }} className="text-muted-foreground mt-0.5">{log.detail}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="bg-secondary text-muted-foreground rounded-full px-2 py-0.5" style={{ fontSize: 10 }}>{log.zone}</span>
                        <span style={{ fontSize: 11 }} className="text-muted-foreground/60">{log.operator}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: 11 }} className="text-muted-foreground flex-shrink-0 mt-0.5">{log.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-16">
              <Filter className="w-10 h-10 text-border mx-auto mb-3" />
              <p className="text-muted-foreground/80" style={{ fontSize: 14 }}>{t('logs.noData')}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
