const ctx = document.getElementById('metricsChart').getContext('2d');
let metricsChart;

const chartData = {
    datasets: [{
        label: 'CPU Usage %', borderColor: '#E85F5C',
    }, {
        label: 'Memory Usage %', borderColor: '#2D82B7',
    }]
};

const chartOptions = {
    scales: {
        x: {
            title: {
                display: true, text: 'Datetime',
            }
        }, y: {
            min: 0, max: 100, title: {
                display: true, text: 'Percentage (%)'
            }
        }
    }
}

function createChart() {
    metricsChart = new Chart(ctx, {
        type: 'line', data: chartData, options: chartOptions
    });
}

async function fetchMetrics() {
    const response = await fetch(`/system-metrics?limit=30`);
    return await response.json();
}

function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString(undefined, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
}

function updateChart(data) {
    chartData.datasets[0].data = [];
    chartData.datasets[1].data = [];
    data.forEach(point => {
        chartData.datasets[0].data.push({x: point.timestamp, y: point.cpu_usage});
        chartData.datasets[1].data.push({x: point.timestamp, y: point.memory_usage});
    });
    metricsChart.update();
}

async function fetchMetricsAndUpdateChart() {
    let data = await fetchMetrics();
    data = data.map(point => ({
        ...point, timestamp: formatTimestamp(point.timestamp)
    }));
    updateChart(data);
}

document.addEventListener('DOMContentLoaded', () => {
    createChart();
    fetchMetricsAndUpdateChart();

    const socket = io();
    socket.on('new_system_metrics', () => {
        fetchMetricsAndUpdateChart();
    });
});