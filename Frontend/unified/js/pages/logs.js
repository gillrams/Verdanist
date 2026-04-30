/**
 * Logs Page JavaScript
 * Export functionality: CSV, Excel, PDF with professional formatting
 * Now integrated with Supabase for real-time pump_logs data
 */

function getSupabaseLogs() {
    if (typeof window.initSupabase === 'function') {
        return window.initSupabase();
    }
    return null;
}

// Sample log data (fallback when Supabase is not available)
let logsData = [
    {
        zone: 'Zone A: Indoor Hydroponics',
        action: 'Pump ON',
        detail: 'Nutrient Cycle',
        type: 'Timer',
        timestamp: new Date('2026-04-21T08:30:00'),
        status: 'success'
    },
    {
        zone: 'Zone C: Outdoor Soil',
        action: 'Valve OFF',
        detail: 'Irrigation Complete',
        type: 'Auto',
        timestamp: new Date('2026-04-21T06:15:00'),
        status: 'success'
    },
    {
        zone: 'Main Reservoir',
        action: 'Refill Started',
        detail: 'Water Level Low',
        type: 'Manual',
        timestamp: new Date('2026-04-20T23:45:00'),
        status: 'warning'
    },
    {
        zone: 'Zone B: Seedling Trays',
        action: 'Misters ON',
        detail: 'Humidity Drop',
        type: 'Auto',
        timestamp: new Date('2026-04-20T16:20:00'),
        status: 'success'
    },
    {
        zone: 'Zone A: Indoor Hydroponics',
        action: 'pH Check',
        detail: 'pH Level Optimal (6.2)',
        type: 'Auto',
        timestamp: new Date('2026-04-20T12:00:00'),
        status: 'success'
    },
    {
        zone: 'Zone D: Greenhouse',
        action: 'Fan ON',
        detail: 'Temperature High (32°C)',
        type: 'Auto',
        timestamp: new Date('2026-04-20T10:30:00'),
        status: 'warning'
    },
    {
        zone: 'Main Reservoir',
        action: 'Refill Complete',
        detail: 'Water Level Normal',
        type: 'Manual',
        timestamp: new Date('2026-04-20T09:15:00'),
        status: 'success'
    },
    {
        zone: 'Zone C: Outdoor Soil',
        action: 'Valve ON',
        detail: 'Scheduled Irrigation',
        type: 'Timer',
        timestamp: new Date('2026-04-20T06:00:00'),
        status: 'success'
    }
];

let filteredLogs = [...logsData];
let displayCount = 4;

/**
 * Format timestamp to readable string
 */
function formatTimestamp(date) {
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 24) {
        return `Today, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (hours < 48) {
        return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
}

/**
 * Render logs to DOM
 */
function renderLogs() {
    const container = document.querySelector('.bg-surface-container-low.rounded-xl');
    if (!container) return;
    
    const logsToShow = filteredLogs.slice(0, displayCount);
    
    container.innerHTML = logsToShow.map(log => {
        const statusColor = log.status === 'warning' ? 'tertiary' : 'secondary';
        const typeColors = {
            'Timer': 'bg-surface-container-high text-on-surface-variant',
            'Auto': 'bg-surface-container-high text-primary',
            'Manual': 'bg-surface-container-highest text-secondary'
        };
        
        return `
        <div class="bg-surface hover:bg-surface-container transition-colors rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="flex items-center gap-5">
                <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                    <span class="material-symbols-outlined text-lg">${log.status === 'success' ? 'check_circle' : 'warning'}</span>
                </div>
                <div>
                    <h4 class="font-headline font-bold text-on-surface text-lg">${log.zone}</h4>
                    <p class="text-sm text-${statusColor} font-medium mt-0.5">${log.action} <span class="text-on-surface-variant mx-2">•</span> ${log.detail}</p>
                </div>
            </div>
            <div class="flex items-center gap-6 sm:gap-8 self-start sm:self-auto ml-15 sm:ml-0">
                <span class="px-3 py-1 ${typeColors[log.type] || 'bg-surface-container-high text-on-surface-variant'} rounded-full text-xs font-bold uppercase tracking-wider">${log.type}</span>
                <span class="text-sm font-medium text-stone-500 whitespace-nowrap">${formatTimestamp(log.timestamp)}</span>
            </div>
        </div>
        `;
    }).join('');
    
    // Update Load More button visibility
    const loadMoreBtn = document.querySelector('button .material-symbols-outlined') || 
                        document.querySelector('button.text-stone-400');
    if (loadMoreBtn) {
        if (displayCount >= filteredLogs.length) {
            loadMoreBtn.style.display = 'none';
        } else {
            loadMoreBtn.style.display = 'flex';
        }
    }
}

/**
 * Search functionality
 */
function setupSearch() {
    const searchInput = document.querySelector('input[placeholder="Search logs..."]');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        filteredLogs = logsData.filter(log => 
            log.zone.toLowerCase().includes(query) ||
            log.action.toLowerCase().includes(query) ||
            log.detail.toLowerCase().includes(query) ||
            log.type.toLowerCase().includes(query)
        );
        displayCount = 4;
        renderLogs();
    });
}

/**
 * Export to CSV
 */
function exportToCSV() {
    const headers = ['Date', 'Time', 'Zone', 'Action', 'Detail', 'Type', 'Status'];
    const rows = filteredLogs.map(log => [
        log.timestamp.toLocaleDateString('en-US'),
        log.timestamp.toLocaleTimeString('en-US'),
        log.zone,
        log.action,
        log.detail,
        log.type,
        log.status
    ]);
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Verdanist_Logs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    showToast('CSV exported successfully!', 'success');
}

/**
 * Export to Excel with professional formatting
 */
function exportToExcel() {
    // Create table HTML for Excel
    const headers = ['Date', 'Time', 'Zone', 'Action', 'Detail', 'Type', 'Status'];
    
    let html = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" 
              xmlns:x="urn:schemas-microsoft-com:office:excel" 
              xmlns="http://www.w3.org/TR/REC-html40">
        <head>
            <meta charset="utf-8">
            <style>
                /* Professional Excel styling */
                .header {
                    background-color: #4be277;
                    color: #003915;
                    font-weight: bold;
                    font-size: 12pt;
                    font-family: 'Plus Jakarta Sans', Arial, sans-serif;
                    text-align: center;
                    vertical-align: middle;
                    border: 1px solid #2d2927;
                    padding: 10px;
                }
                .subheader {
                    background-color: #221f1d;
                    color: #e9e1dd;
                    font-weight: bold;
                    font-size: 11pt;
                    font-family: 'Manrope', Arial, sans-serif;
                    text-align: center;
                    vertical-align: middle;
                    border: 1px solid #3d4a3d;
                    padding: 8px;
                }
                .data-cell {
                    font-family: 'Manrope', Arial, sans-serif;
                    font-size: 10pt;
                    color: #161311;
                    border: 1px solid #bccbb9;
                    padding: 6px 8px;
                    vertical-align: middle;
                }
                .date-cell { text-align: center; }
                .time-cell { text-align: center; }
                .zone-cell { font-weight: 600; }
                .type-auto { color: #4be277; font-weight: 600; }
                .type-timer { color: #8bcfff; font-weight: 600; }
                .type-manual { color: #96d5a3; font-weight: 600; }
                .status-success { color: #22c55e; }
                .status-warning { color: #ff6b6b; }
                table { border-collapse: collapse; width: 100%; }
                .title-row td {
                    font-size: 14pt;
                    font-weight: bold;
                    color: #161311;
                    padding: 15px;
                    text-align: center;
                    font-family: 'Plus Jakarta Sans', Arial, sans-serif;
                }
                .info-row td {
                    font-size: 9pt;
                    color: #869585;
                    padding: 5px;
                    text-align: center;
                    font-family: 'Manrope', Arial, sans-serif;
                }
                .alt-row { background-color: #f5f5f5; }
            </style>
        </head>
        <body>
            <table>
                <!-- Title -->
                <tr class="title-row">
                    <td colspan="7">Verdanist Farm Activity Logs</td>
                </tr>
                <tr class="info-row">
                    <td colspan="7">Persada Farm Bogor | Exported: ${new Date().toLocaleString('en-US')}</td>
                </tr>
                <tr><td colspan="7" style="height: 10px;"></td></tr>
                
                <!-- Headers -->
                <tr>
                    ${headers.map(h => `<td class="subheader">${h}</td>`).join('')}
                </tr>
                
                <!-- Data -->
                ${filteredLogs.map((log, i) => {
                    const typeClass = log.type === 'Auto' ? 'type-auto' : 
                                     log.type === 'Timer' ? 'type-timer' : 'type-manual';
                    const statusClass = log.status === 'success' ? 'status-success' : 'status-warning';
                    const altClass = i % 2 === 1 ? 'alt-row' : '';
                    
                    return `
                    <tr class="${altClass}">
                        <td class="data-cell date-cell">${log.timestamp.toLocaleDateString('en-US')}</td>
                        <td class="data-cell time-cell">${log.timestamp.toLocaleTimeString('en-US')}</td>
                        <td class="data-cell zone-cell">${log.zone}</td>
                        <td class="data-cell">${log.action}</td>
                        <td class="data-cell">${log.detail}</td>
                        <td class="data-cell ${typeClass}">${log.type}</td>
                        <td class="data-cell ${statusClass}">${log.status.toUpperCase()}</td>
                    </tr>
                    `;
                }).join('')}
            </table>
        </body>
        </html>
    `;
    
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Verdanist_Logs_${new Date().toISOString().split('T')[0]}.xls`;
    link.click();
    
    showToast('Excel exported successfully!', 'success');
}

/**
 * Export to PDF with professional formatting
 */
function exportToPDF() {
    // Create a printable HTML page
    const printWindow = window.open('', '_blank');
    
    const headers = ['Date', 'Time', 'Zone', 'Action', 'Detail', 'Type', 'Status'];
    
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Verdanist Farm Activity Logs</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Manrope:wght@400;500;600;700&display=swap');
                
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: 'Manrope', 'Arial', sans-serif;
                    font-size: 10pt;
                    line-height: 1.4;
                    color: #161311;
                    background: #fff;
                    padding: 40px;
                }
                
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 3px solid #4be277;
                }
                
                .logo-section {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 15px;
                    margin-bottom: 15px;
                }
                
                .logo {
                    width: 50px;
                    height: 50px;
                    background: #4be277;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    font-weight: 800;
                    color: #003915;
                    font-size: 20px;
                }
                
                .title {
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    font-size: 24pt;
                    font-weight: 800;
                    color: #161311;
                    margin-bottom: 5px;
                }
                
                .subtitle {
                    font-size: 12pt;
                    color: #869585;
                    font-weight: 500;
                }
                
                .meta-info {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 25px;
                    padding: 15px 20px;
                    background: #f5f5f5;
                    border-radius: 8px;
                    font-size: 9pt;
                    color: #555;
                }
                
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                }
                
                thead {
                    display: table-header-group;
                }
                
                th {
                    background: #221f1d;
                    color: #e9e1dd;
                    font-family: 'Plus Jakarta Sans', sans-serif;
                    font-weight: 700;
                    font-size: 10pt;
                    padding: 12px 10px;
                    text-align: left;
                    border: 1px solid #3d4a3d;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                th:first-child { border-radius: 8px 0 0 0; }
                th:last-child { border-radius: 0 8px 0 0; }
                
                td {
                    padding: 10px;
                    border: 1px solid #bccbb9;
                    font-size: 9.5pt;
                    vertical-align: middle;
                }
                
                tr:nth-child(even) {
                    background: #fafafa;
                }
                
                tr:hover {
                    background: #f0f0f0;
                }
                
                .zone-cell {
                    font-weight: 600;
                    color: #161311;
                }
                
                .type-badge {
                    display: inline-block;
                    padding: 3px 10px;
                    border-radius: 12px;
                    font-size: 8pt;
                    font-weight: 700;
                    text-transform: uppercase;
                }
                
                .type-auto {
                    background: #e6f9eb;
                    color: #22c55e;
                }
                
                .type-timer {
                    background: #e6f4ff;
                    color: #36b6fb;
                }
                
                .type-manual {
                    background: #f0f7f1;
                    color: #4a9b5a;
                }
                
                .status-success {
                    color: #22c55e;
                    font-weight: 600;
                }
                
                .status-warning {
                    color: #ff6b6b;
                    font-weight: 600;
                }
                
                .footer {
                    margin-top: 40px;
                    padding-top: 15px;
                    border-top: 1px solid #ddd;
                    text-align: center;
                    font-size: 8pt;
                    color: #999;
                }
                
                @media print {
                    body { padding: 20px; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="logo-section">
                    <div class="logo">V</div>
                    <div>
                        <div class="title">Verdanist Farm Activity Logs</div>
                        <div class="subtitle">Persada Farm Bogor - Smart Agriculture Management System</div>
                    </div>
                </div>
            </div>
            
            <div class="meta-info">
                <span><strong>Total Records:</strong> ${filteredLogs.length}</span>
                <span><strong>Export Date:</strong> ${new Date().toLocaleString('en-US')}</span>
                <span><strong>Generated by:</strong> Verdanist System</span>
            </div>
            
            <table>
                <thead>
                    <tr>
                        ${headers.map(h => `<th>${h}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${filteredLogs.map(log => {
                        const typeClass = log.type === 'Auto' ? 'type-auto' : 
                                         log.type === 'Timer' ? 'type-timer' : 'type-manual';
                        const statusClass = log.status === 'success' ? 'status-success' : 'status-warning';
                        
                        return `
                        <tr>
                            <td>${log.timestamp.toLocaleDateString('en-US')}</td>
                            <td>${log.timestamp.toLocaleTimeString('en-US')}</td>
                            <td class="zone-cell">${log.zone}</td>
                            <td>${log.action}</td>
                            <td>${log.detail}</td>
                            <td><span class="type-badge ${typeClass}">${log.type}</span></td>
                            <td class="${statusClass}">${log.status.toUpperCase()}</td>
                        </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
            
            <div class="footer">
                <p>This document was automatically generated by the Verdanist Smart Farm Management System.</p>
                <p>&copy; ${new Date().getFullYear()} Verdanist. All rights reserved.</p>
            </div>
            
            <div class="no-print" style="position: fixed; bottom: 20px; right: 20px;">
                <button onclick="window.print()" style="padding: 12px 24px; background: #4be277; color: #003915; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif;">
                    Print / Save as PDF
                </button>
            </div>
            
            <script>
                // Auto-trigger print dialog
                setTimeout(() => {
                    window.print();
                }, 500);
            </script>
        </body>
        </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
    
    showToast('PDF export opened! Use "Save as PDF" in the print dialog.', 'success');
}

/**
 * Setup export dropdown
 */
function setupExportDropdown() {
    const exportBtn = document.getElementById('export-btn');
    if (!exportBtn) {
        console.error('Export button not found');
        return;
    }
    
    console.log('Setting up export dropdown...');
    
    // Create dropdown
    const dropdown = document.createElement('div');
    dropdown.id = 'export-dropdown';
    dropdown.className = 'fixed z-[100] hidden bg-surface-container rounded-xl shadow-xl border border-outline-variant/30 overflow-hidden min-w-[200px]';
    dropdown.style.backgroundColor = '#221f1d';
    dropdown.style.boxShadow = '0 10px 40px rgba(0,0,0,0.5)';
    dropdown.innerHTML = `
        <button class="w-full text-left px-4 py-3.5 hover:bg-surface-container-high transition-colors flex items-center gap-3 text-on-surface font-body text-sm border-b border-outline-variant/20 last:border-0" onclick="exportToCSV(); hideExportDropdown();">
            <span class="material-symbols-outlined text-secondary text-lg">description</span>
            <span>Export CSV</span>
        </button>
        <button class="w-full text-left px-4 py-3.5 hover:bg-surface-container-high transition-colors flex items-center gap-3 text-on-surface font-body text-sm border-b border-outline-variant/20 last:border-0" onclick="exportToExcel(); hideExportDropdown();">
            <span class="material-symbols-outlined text-primary text-lg">table</span>
            <span>Export Excel</span>
        </button>
        <button class="w-full text-left px-4 py-3.5 hover:bg-surface-container-high transition-colors flex items-center gap-3 text-on-surface font-body text-sm" onclick="exportToPDF(); hideExportDropdown();">
            <span class="material-symbols-outlined text-tertiary text-lg">picture_as_pdf</span>
            <span>Export PDF</span>
        </button>
    `;
    document.body.appendChild(dropdown);
    
    console.log('Dropdown created:', dropdown);
    
    // Button click handler - using capture phase to ensure we catch it
    exportBtn.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('Export button clicked!');
        
        const rect = exportBtn.getBoundingClientRect();
        const dropdownHeight = 150;
        const spaceBelow = window.innerHeight - rect.bottom;
        
        console.log('Button rect:', rect);
        
        // Position below button if space, otherwise above
        if (spaceBelow > dropdownHeight) {
            dropdown.style.top = `${rect.bottom + 8}px`;
        } else {
            dropdown.style.top = `${rect.top - dropdownHeight - 8}px`;
        }
        
        dropdown.style.left = `${rect.left}px`;
        dropdown.style.minWidth = `${rect.width}px`;
        
        console.log('Dropdown position set:', dropdown.style.top, dropdown.style.left);
        console.log('Dropdown currently hidden:', dropdown.classList.contains('hidden'));
        
        dropdown.classList.toggle('hidden');
        console.log('Dropdown toggled, now hidden:', dropdown.classList.contains('hidden'));
    };
    
    console.log('Click handler attached to export button');
    
    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && !exportBtn.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    });
    
    console.log('Export dropdown setup complete');
}

function hideExportDropdown() {
    const dropdown = document.getElementById('export-dropdown');
    if (dropdown) dropdown.classList.add('hidden');
}

/**
 * Setup Load More button
 */
function setupLoadMore() {
    const loadMoreBtn = document.querySelector('button.text-stone-400');
    if (!loadMoreBtn) return;
    
    loadMoreBtn.addEventListener('click', () => {
        displayCount += 4;
        renderLogs();
    });
}

/**
 * Toast notification
 */
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-32 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full font-body text-sm font-medium z-50 transition-all duration-300 opacity-0 translate-y-4 ${
        type === 'success' ? 'bg-primary text-on-primary' : 'bg-error text-on-error'
    }`;
    toast.innerHTML = `
        <span class="material-symbols-outlined text-lg mr-2 align-middle">${type === 'success' ? 'check_circle' : 'error'}</span>
        ${message}
    `;
    document.body.appendChild(toast);
    
    requestAnimationFrame(() => {
        toast.classList.remove('opacity-0', 'translate-y-4');
    });
    
    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-4');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Fetch pump logs from Supabase
 */
async function fetchPumpLogsFromSupabase() {
    const supabase = getSupabaseLogs();
    if (!supabase) return;
    try {
        const { data, error } = await supabase
            .from('pump_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);
        if (error) {
            console.warn('Supabase pump_logs fetch error:', error.message);
            return;
        }
        if (data && data.length > 0) {
            logsData = data.map(row => ({
                zone: row.zone === 'A' ? 'Zone A: Indoor Hydroponics' :
                      row.zone === 'B' ? 'Zone B: Seedling Trays' :
                      row.zone === 'C' ? 'Zone C: Outdoor Soil' :
                      row.zone === 'D' ? 'Zone D: Greenhouse' : row.zone,
                action: row.action,
                detail: row.detail || `${row.trigger} triggered`,
                type: row.trigger.charAt(0).toUpperCase() + row.trigger.slice(1),
                timestamp: new Date(row.created_at),
                status: row.trigger === 'auto' ? 'success' : 'warning'
            }));
            filteredLogs = [...logsData];
            console.log('Loaded', logsData.length, 'logs from Supabase');
        }
    } catch (e) {
        console.warn('Could not fetch pump logs from Supabase:', e);
    }
}

/**
 * Subscribe to real-time pump logs from Supabase
 */
function subscribeToPumpLogs() {
    const supabase = getSupabaseLogs();
    if (!supabase) return;
    try {
        supabase
            .channel('pump_logs_changes')
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'pump_logs' },
                (payload) => {
                    const row = payload.new;
                    const newLog = {
                        zone: row.zone === 'A' ? 'Zone A: Indoor Hydroponics' :
                              row.zone === 'B' ? 'Zone B: Seedling Trays' :
                              row.zone === 'C' ? 'Zone C: Outdoor Soil' :
                              row.zone === 'D' ? 'Zone D: Greenhouse' : row.zone,
                        action: row.action,
                        detail: row.detail || `${row.trigger} triggered`,
                        type: row.trigger.charAt(0).toUpperCase() + row.trigger.slice(1),
                        timestamp: new Date(row.created_at),
                        status: row.trigger === 'auto' ? 'success' : 'warning'
                    };
                    logsData.unshift(newLog);
                    filteredLogs.unshift(newLog);
                    renderLogs();
                    showToast('New activity log received', 'info');
                }
            )
            .subscribe();
        console.log('Subscribed to Supabase real-time pump logs');
    } catch (e) {
        console.warn('Could not subscribe to pump logs:', e);
    }
}

/**
 * Initialize Logs Page
 */
async function initLogs() {
    await fetchPumpLogsFromSupabase();
    renderLogs();
    setupSearch();
    setupExportDropdown();
    setupLoadMore();
    subscribeToPumpLogs();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLogs);
} else {
    initLogs();
}
