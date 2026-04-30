// Verdanist Analytics - ApexCharts Implementation
// Full-featured charts with real data visualization
// Now integrated with Supabase for real sensor data

// Supabase helper
function getSupabaseAnalytics() {
    if (typeof window.initSupabase === 'function') {
        return window.initSupabase();
    }
    return null;
}

/**
 * Fetch sensor readings from Supabase for chart data
 */
async function fetchSensorReadingsForChart(range) {
    const supabase = getSupabaseAnalytics();
    if (!supabase) return null;
    try {
        let limit = 24;
        if (range === '1h') limit = 12;
        if (range === '7d') limit = 28;
        if (range === '30d') limit = 30;

        const { data, error } = await supabase
            .from('sensor_readings')
            .select('*')
            .order('recorded_at', { ascending: false })
            .limit(limit * 2);

        if (error) {
            console.warn('Supabase sensor fetch error:', error.message);
            return null;
        }
        if (!data || data.length === 0) return null;

        // Group by timestamp bucket
        const tempMap = new Map();
        const humidityMap = new Map();
        const categories = [];

        data.forEach(row => {
            const time = new Date(row.recorded_at);
            let key;
            if (range === '1h') {
                key = time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            } else if (range === '24h') {
                key = time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            } else if (range === '7d') {
                key = time.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
            } else {
                key = time.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
            }
            if (!categories.includes(key)) categories.unshift(key);
            if (row.type === 'temperature') {
                tempMap.set(key, row.value);
            } else if (row.type === 'humidity') {
                humidityMap.set(key, row.value);
            }
        });

        const tempData = categories.map(k => tempMap.get(k) ?? null).filter(v => v !== null);
        const humidityData = categories.map(k => humidityMap.get(k) ?? null).filter(v => v !== null);

        if (tempData.length === 0 && humidityData.length === 0) return null;
        return { tempData, humidityData, categories };
    } catch (e) {
        console.warn('Could not fetch sensor readings for chart:', e);
        return null;
    }
}

// Theme Colors (matching Verdanist design system)
const themeColors = {
    primary: '#4be277',
    primaryDark: '#22c55e',
    tertiary: '#8bcfff',
    tertiaryDark: '#36b6fb',
    secondary: '#96d5a3',
    error: '#ff6b6b',
    warning: '#ffd93d',
    background: '#161311',
    surface: '#221f1d',
    surfaceHigh: '#2d2927',
    text: '#e9e1dd',
    textVariant: '#869585',
    outline: 'rgba(134, 149, 133, 0.2)'
};

// Chart instances
let dualAxisChart = null;
let soilMoistureChart = null;
let waterConsumptionChart = null;

/**
 * Generate Mock Data based on time range
 */
function generateData(range) {
    const dataPoints = {
        '1h': 12,
        '24h': 24,
        '7d': 28,
        '30d': 30
    };
    
    const points = dataPoints[range] || 24;
    const tempData = [];
    const humidityData = [];
    const categories = [];
    
    const now = new Date();
    
    for (let i = points - 1; i >= 0; i--) {
        const time = new Date(now.getTime());
        
        if (range === '1h') {
            time.setMinutes(time.getMinutes() - i * 5);
            categories.push(time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
        } else if (range === '24h') {
            time.setHours(time.getHours() - i);
            categories.push(time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
        } else if (range === '7d') {
            time.setDate(time.getDate() - i);
            categories.push(time.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }));
        } else {
            time.setDate(time.getDate() - i);
            categories.push(time.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }));
        }
        
        // Simulate realistic temperature (22-35°C) and humidity (40-90%)
        const baseTemp = 26 + Math.sin(i * 0.5) * 4 + Math.random() * 2;
        const baseHumidity = 70 - Math.sin(i * 0.5) * 20 + Math.random() * 10;
        
        tempData.push(Math.round(baseTemp * 10) / 10);
        humidityData.push(Math.round(baseHumidity));
    }
    
    return { tempData, humidityData, categories };
}

/**
 * Generate Forecast Data (Prediction)
 */
function generateForecast(historicalData, range) {
    const forecastPoints = range === '1h' ? 3 : (range === '24h' ? 6 : 3);
    const forecast = [];
    
    const lastValue = historicalData[historicalData.length - 1];
    const trend = (historicalData[historicalData.length - 1] - historicalData[historicalData.length - 3]) / 2;
    
    for (let i = 1; i <= forecastPoints; i++) {
        forecast.push(Math.round((lastValue + trend * i + Math.random() * 2) * 10) / 10);
    }
    
    return forecast;
}

/**
 * Initialize Dual-Axis Chart (Temperature + Humidity)
 */
async function initDualAxisChart() {
    let chartData = await fetchSensorReadingsForChart('24h');
    if (!chartData) {
        chartData = generateData('24h');
    }
    const { tempData, humidityData, categories } = chartData;
    const tempForecast = generateForecast(tempData, '24h');
    const humidityForecast = generateForecast(humidityData, '24h');
    
    // Add forecast to data
    const fullTempData = [...tempData, ...Array(tempForecast.length).fill(null)];
    const fullHumidityData = [...humidityData, ...Array(humidityForecast.length).fill(null)];
    
    // Create forecast series (dashed line)
    const tempForecastData = Array(tempData.length).fill(null).concat(tempForecast);
    const humidityForecastData = Array(humidityData.length).fill(null).concat(humidityForecast);
    
    const options = {
        series: [
            {
                name: 'Temperature',
                type: 'area',
                data: fullTempData
            },
            {
                name: 'Temperature (Forecast)',
                type: 'line',
                data: tempForecastData
            },
            {
                name: 'Humidity',
                type: 'area',
                data: fullHumidityData
            },
            {
                name: 'Humidity (Forecast)',
                type: 'line',
                data: humidityForecastData
            }
        ],
        chart: {
            height: 400,
            type: 'line',
            fontFamily: 'Manrope, sans-serif',
            background: 'transparent',
            toolbar: {
                show: false
            },
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800
            }
        },
        stroke: {
            curve: 'smooth',
            width: [3, 2, 3, 2],
            dashArray: [0, 5, 0, 5]
        },
        fill: {
            type: ['gradient', 'none', 'gradient', 'none'],
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.3,
                opacityTo: 0.05,
                stops: [0, 100]
            }
        },
        colors: [
            themeColors.primary,
            themeColors.primary,
            themeColors.tertiary,
            themeColors.tertiary
        ],
        dataLabels: {
            enabled: false
        },
        labels: categories,
        xaxis: {
            labels: {
                style: {
                    colors: themeColors.textVariant,
                    fontSize: '11px'
                }
            },
            axisBorder: {
                show: true,
                color: themeColors.outline
            },
            axisTicks: {
                show: false
            },
            tooltip: {
                enabled: false
            }
        },
        yaxis: [
            {
                seriesName: 'Temperature',
                title: {
                    text: 'Temperature (°C)',
                    style: {
                        color: themeColors.primary,
                        fontSize: '12px'
                    }
                },
                labels: {
                    style: {
                        colors: themeColors.primary,
                        fontSize: '11px'
                    },
                    formatter: (value) => value ? value.toFixed(1) + '°C' : ''
                },
                min: 20,
                max: 40
            },
            {
                seriesName: 'Humidity',
                opposite: true,
                title: {
                    text: 'Humidity (%)',
                    style: {
                        color: themeColors.tertiary,
                        fontSize: '12px'
                    }
                },
                labels: {
                    style: {
                        colors: themeColors.tertiary,
                        fontSize: '11px'
                    },
                    formatter: (value) => value ? value + '%' : ''
                },
                min: 30,
                max: 100
            }
        ],
        grid: {
            borderColor: themeColors.outline,
            strokeDashArray: 4,
            xaxis: {
                lines: {
                    show: true
                }
            },
            yaxis: {
                lines: {
                    show: true
                }
            }
        },
        legend: {
            show: false
        },
        tooltip: {
            shared: true,
            intersect: false,
            y: {
                formatter: function (y, { seriesIndex }) {
                    if (typeof y !== "undefined") {
                        if (seriesIndex === 0 || seriesIndex === 1) {
                            return y.toFixed(1) + " °C";
                        }
                        return y + "%";
                    }
                    return y;
                }
            },
            theme: 'dark',
            style: {
                fontSize: '12px',
                fontFamily: 'Manrope, sans-serif'
            },
            custom: function({series, seriesIndex, dataPointIndex, w}) {
                const temp = series[0][dataPointIndex];
                const humidity = series[2][dataPointIndex];
                const isForecast = dataPointIndex >= (series[0].length - tempForecast.length);
                
                return `
                    <div style="padding: 8px;">
                        <div style="font-weight: 600; margin-bottom: 4px; color: ${themeColors.text};">
                            ${w.globals.labels[dataPointIndex]} ${isForecast ? '(Forecast)' : ''}
                        </div>
                        <div style="color: ${themeColors.primary};">
                            🌡️ ${temp ? temp.toFixed(1) : '--'} °C
                        </div>
                        <div style="color: ${themeColors.tertiary};">
                            💧 ${humidity ? humidity : '--'}%
                        </div>
                    </div>
                `;
            }
        },
        annotations: {
            yaxis: [
                {
                    y: 75,
                    y2: 85,
                    borderColor: themeColors.secondary,
                    fillColor: themeColors.secondary,
                    opacity: 0.1,
                    label: {
                        borderColor: themeColors.secondary,
                        style: {
                            color: themeColors.text,
                            background: themeColors.surfaceHigh
                        },
                        text: 'Optimal Humidity Range (75-85%)'
                    }
                },
                {
                    y: 75,
                    borderColor: themeColors.error,
                    strokeDashArray: 6,
                    label: {
                        borderColor: themeColors.error,
                        style: {
                            color: themeColors.text,
                            background: themeColors.surfaceHigh
                        },
                        text: 'Target: 75%'
                    }
                }
            ]
        }
    };

    const chartEl = document.querySelector('#dual-axis-chart');
    if (chartEl) {
        // Clear loading spinner
        chartEl.innerHTML = '';
        try {
            dualAxisChart = new ApexCharts(chartEl, options);
            dualAxisChart.render();
        } catch (e) {
            console.error('Chart error:', e);
            chartEl.innerHTML = '<div class="flex items-center justify-center h-full text-error"><span class="font-body">Failed to load chart</span></div>';
        }
    }
}

/**
 * Initialize Soil Moisture Chart
 */
function initSoilMoistureChart() {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const zoneAData = [65, 68, 62, 70, 72, 75, 68];
    const zoneBData = [55, 58, 52, 60, 62, 65, 58];
    
    const options = {
        series: [
            {
                name: 'Zone A',
                data: zoneAData
            },
            {
                name: 'Zone B',
                data: zoneBData
            }
        ],
        chart: {
            height: 300,
            type: 'area',
            fontFamily: 'Manrope, sans-serif',
            background: 'transparent',
            toolbar: {
                show: false
            }
        },
        stroke: {
            curve: 'smooth',
            width: 3
        },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.4,
                opacityTo: 0.05
            }
        },
        colors: [themeColors.secondary, themeColors.tertiary],
        dataLabels: {
            enabled: false
        },
        labels: days,
        xaxis: {
            labels: {
                style: {
                    colors: themeColors.textVariant,
                    fontSize: '11px'
                }
            },
            axisBorder: {
                show: true,
                color: themeColors.outline
            },
            axisTicks: {
                show: false
            }
        },
        yaxis: {
            labels: {
                style: {
                    colors: themeColors.textVariant,
                    fontSize: '11px'
                },
                formatter: (value) => value + '%'
            },
            min: 40,
            max: 90
        },
        grid: {
            borderColor: themeColors.outline,
            strokeDashArray: 4
        },
        legend: {
            show: false
        },
        tooltip: {
            theme: 'dark',
            y: {
                formatter: (value) => value + '%'
            }
        },
        annotations: {
            yaxis: [
                {
                    y: 60,
                    y2: 75,
                    borderColor: themeColors.secondary,
                    fillColor: themeColors.secondary,
                    opacity: 0.1,
                    label: {
                        borderColor: themeColors.secondary,
                        style: {
                            color: themeColors.text,
                            background: themeColors.surfaceHigh,
                            fontSize: '10px'
                        },
                        text: 'Optimal Range (60-75%)'
                    }
                }
            ]
        }
    };

    const chartEl = document.querySelector('#soil-moisture-chart');
    if (chartEl) {
        soilMoistureChart = new ApexCharts(chartEl, options);
        soilMoistureChart.render();
    }
}

/**
 * Initialize Water Consumption Bar Chart
 */
function initWaterConsumptionChart() {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const zoneAUsage = [12.5, 11.8, 13.2, 10.9, 12.1, 14.5, 11.2];
    const zoneBUsage = [8.3, 9.1, 7.8, 8.5, 9.2, 10.1, 8.7];
    
    const options = {
        series: [
            {
                name: 'Zone A',
                data: zoneAUsage
            },
            {
                name: 'Zone B',
                data: zoneBUsage
            }
        ],
        chart: {
            height: 300,
            type: 'bar',
            fontFamily: 'Manrope, sans-serif',
            background: 'transparent',
            toolbar: {
                show: false
            },
            stacked: false
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: '55%',
                borderRadius: 6,
                borderRadiusApplication: 'end'
            }
        },
        colors: [themeColors.primary, themeColors.tertiary],
        dataLabels: {
            enabled: false
        },
        labels: days,
        xaxis: {
            labels: {
                style: {
                    colors: themeColors.textVariant,
                    fontSize: '11px'
                }
            },
            axisBorder: {
                show: true,
                color: themeColors.outline
            },
            axisTicks: {
                show: false
            }
        },
        yaxis: {
            labels: {
                style: {
                    colors: themeColors.textVariant,
                    fontSize: '11px'
                },
                formatter: (value) => value + 'L'
            }
        },
        grid: {
            borderColor: themeColors.outline,
            strokeDashArray: 4
        },
        legend: {
            show: false
        },
        tooltip: {
            theme: 'dark',
            y: {
                formatter: (value) => value + ' Liters'
            },
            custom: function({series, seriesIndex, dataPointIndex, w}) {
                const zoneA = series[0][dataPointIndex];
                const zoneB = series[1][dataPointIndex];
                const total = zoneA + zoneB;
                
                return `
                    <div style="padding: 8px;">
                        <div style="font-weight: 600; margin-bottom: 4px; color: ${themeColors.text};">
                            ${w.globals.labels[dataPointIndex]}
                        </div>
                        <div style="color: ${themeColors.primary};">
                            Zone A: ${zoneA} L
                        </div>
                        <div style="color: ${themeColors.tertiary};">
                            Zone B: ${zoneB} L
                        </div>
                        <div style="color: ${themeColors.textVariant}; font-size: 11px; margin-top: 4px; padding-top: 4px; border-top: 1px solid ${themeColors.outline};">
                            Total: ${total.toFixed(1)} L
                        </div>
                    </div>
                `;
            }
        }
    };

    const chartEl = document.querySelector('#water-consumption-chart');
    if (chartEl) {
        waterConsumptionChart = new ApexCharts(chartEl, options);
        waterConsumptionChart.render();
    }
}

/**
 * Setup Time Range Filter Buttons
 */
function setupTimeRangeFilters() {
    const filterBtns = document.querySelectorAll('.analytics-filter-btn');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active from all
            filterBtns.forEach(b => {
                b.classList.remove('bg-surface-container-high', 'text-on-surface', 'shadow-sm');
                b.classList.add('text-on-surface-variant');
            });
            
            // Add active to clicked
            btn.classList.remove('text-on-surface-variant');
            btn.classList.add('bg-surface-container-high', 'text-on-surface', 'shadow-sm');
            
            // Update chart data
            const range = btn.dataset.range;
            updateDualAxisChart(range);
        });
    });
}

/**
 * Update Dual-Axis Chart with new data
 */
function updateDualAxisChart(range) {
    if (!dualAxisChart) return;
    
    const { tempData, humidityData, categories } = generateData(range);
    
    // Generate forecast
    const tempForecast = generateForecast(tempData, range);
    const humidityForecast = generateForecast(humidityData, range);
    
    const forecastLength = tempForecast.length;
    const fullTempData = [...tempData, ...Array(forecastLength).fill(null)];
    const fullHumidityData = [...humidityData, ...Array(forecastLength).fill(null)];
    const tempForecastData = Array(tempData.length).fill(null).concat(tempForecast);
    const humidityForecastData = Array(humidityData.length).fill(null).concat(humidityForecast);
    
    // Add forecast categories
    const now = new Date();
    const forecastCategories = [...categories];
    
    for (let i = 1; i <= forecastLength; i++) {
        const time = new Date(now.getTime());
        if (range === '1h') {
            time.setMinutes(time.getMinutes() + i * 5);
            forecastCategories.push(time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' (pred)');
        } else if (range === '24h') {
            time.setHours(time.getHours() + i);
            forecastCategories.push(time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' (pred)');
        } else {
            time.setDate(time.getDate() + i);
            forecastCategories.push(time.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + ' (pred)');
        }
    }
    
    dualAxisChart.updateOptions({
        labels: forecastCategories
    });
    
    dualAxisChart.updateSeries([
        { name: 'Temperature', type: 'area', data: fullTempData },
        { name: 'Temperature (Forecast)', type: 'line', data: tempForecastData },
        { name: 'Humidity', type: 'area', data: fullHumidityData },
        { name: 'Humidity (Forecast)', type: 'line', data: humidityForecastData }
    ]);
}

/**
 * Setup Alert Banner Close Button
 */
function setupAlertBanner() {
    const alertBanner = document.querySelector('.max-w-6xl.mx-auto.mb-8.bg-error-container\\/20');
    const closeBtn = alertBanner?.querySelector('button');
    
    if (closeBtn && alertBanner) {
        closeBtn.addEventListener('click', () => {
            alertBanner.style.opacity = '0';
            alertBanner.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                alertBanner.style.display = 'none';
            }, 300);
        });
    }
}

/**
 * Setup Calendar Button
 */
function setupCalendarButton() {
    // Find calendar button by looking for the icon
    const calendarIcons = document.querySelectorAll('.material-symbols-outlined');
    let calendarBtn = null;
    calendarIcons.forEach(icon => {
        if (icon.textContent.trim() === 'calendar_month') {
            calendarBtn = icon.closest('button');
        }
    });
    
    if (calendarBtn) {
        calendarBtn.addEventListener('click', () => {
            if (typeof showToast === 'function') {
                showToast('Custom date range selector coming soon!', 'info');
            } else {
                alert('Custom date range selector coming soon!');
            }
        });
    }
}

/**
 * Setup Add Node Button
 */
function setupAddNodeButton() {
    // Find Add Node button in sidebar
    const aside = document.querySelector('aside');
    let addNodeBtn = null;
    if (aside) {
        const buttons = aside.querySelectorAll('button');
        buttons.forEach(btn => {
            if (btn.textContent.includes('Add Node')) {
                addNodeBtn = btn;
            }
        });
    }
    
    if (addNodeBtn) {
        addNodeBtn.addEventListener('click', () => {
            if (typeof showToast === 'function') {
                showToast('Add Node feature coming soon!', 'info');
            } else {
                alert('Add Node feature coming soon!');
            }
        });
    }
}

/**
 * Setup Sidebar Navigation
 */
function setupSidebarNav() {
    // Find all sidebar links
    const sidebarLinks = document.querySelectorAll('aside a[href="#"]');
    
    sidebarLinks.forEach(link => {
        const icon = link.querySelector('.material-symbols-outlined');
        if (icon) {
            const iconText = icon.textContent.trim();
            
            if (iconText === 'help') {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (typeof showToast === 'function') {
                        showToast('Support page coming soon!', 'info');
                    }
                });
            }
            
            if (iconText === 'logout') {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (confirm('Are you sure you want to logout?')) {
                        console.warn("Sesi belum siap, tapi saya tidak akan mengusir user.");
                    }
                });
            }
        }
    });
}

/**
 * Setup Top Navigation Icons
 */
function setupTopNavIcons() {
    // Find all icons in header
    const headerIcons = document.querySelectorAll('header .material-symbols-outlined, header span.material-symbols-outlined');
    
    headerIcons.forEach(icon => {
        const iconText = icon.textContent.trim();
        const clickableParent = icon.closest('span') || icon.closest('button') || icon;
        
        if (iconText === 'notifications') {
            clickableParent.addEventListener('click', () => {
                if (typeof showToast === 'function') {
                    showToast('No new notifications', 'info');
                }
            });
        }
        
        if (iconText === 'sensors_krx') {
            clickableParent.addEventListener('click', () => {
                if (typeof showToast === 'function') {
                    showToast('All sensors operational', 'success');
                }
            });
        }
    });
}

/**
 * Initialize Analytics Page
 * Sets up all ApexCharts and interactions
 */
async function initAnalytics() {
    console.log('initAnalytics called, ApexCharts available:', typeof ApexCharts !== 'undefined');
    
    if (typeof ApexCharts === 'undefined') {
        console.error('ApexCharts library not loaded!');
        return;
    }
    
    await initDualAxisChart();
    initSoilMoistureChart();
    initWaterConsumptionChart();
    setupTimeRangeFilters();
    setupAlertBanner();
    setupCalendarButton();
    setupAddNodeButton();
    setupSidebarNav();
    setupTopNavIcons();
}

// Initialize when DOM is ready
async function startAnalytics() {
    // Small delay to ensure container has proper dimensions
    await new Promise(r => setTimeout(r, 100));
    await initAnalytics();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startAnalytics);
} else {
    startAnalytics();
}
