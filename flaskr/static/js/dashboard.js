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

async function fetchLogs() {
    const response = await fetch(`/logs?limit=15`);
    return await response.json();
}

function updateLogs(logs) {
    const logsList = document.getElementById('logs-list');
    logsList.innerHTML = '';
    logs.forEach(log => {
        const logItem = document.createElement('li');
        logItem.textContent = formatLog(log);
        logsList.appendChild(logItem);
    });
}

async function fetchAndUpdateLogs() {
    const logs = await fetchLogs();
    updateLogs(logs);
}

function formatLog(log) {
    return `${log.timestamp} ${log.hostname} ${log.process}[${log.pid}]: ${log.message}`;
}

async function fetchProcessesSnapshot() {
    const response = await fetch(`/processes-snapshots?limit=1`);
    return await response.json();
}

function updateProcessesSnapshotTable(snapshot) {
    const tbody = document.getElementById('processes-snapshot-body');
    tbody.innerHTML = '';
    const processes = snapshot[0].processes;
    processes.forEach(process => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${process.pid}</td>
            <td>${process.name}</td>
            <td>${process.status || ''}</td>
            <td>${process.cpu_usage}%</td>
            <td>${process.memory_usage}%</td>
        `;
        tbody.appendChild(row);
    });
}

async function fetchAndUpdateProcessesSnapshotTable() {
    const processes_snapshot = await fetchProcessesSnapshot();
    updateProcessesSnapshotTable(processes_snapshot);
}

document.addEventListener('DOMContentLoaded', () => {
    createChart();
    fetchMetricsAndUpdateChart();
    fetchAndUpdateLogs();
    fetchAndUpdateProcessesSnapshotTable()

    const socket = io();
    socket.on('new_system_metrics', () => {
        fetchMetricsAndUpdateChart();
    });
    socket.on('new_logs', () => {
        fetchAndUpdateLogs();
    });
    socket.on('new_processes_snapshot', () => {
        fetchAndUpdateProcessesSnapshotTable();
    });
});

const promptForm = document.getElementById('prompt-form');
const promptInput = document.getElementById('prompt-input');
const chatHistory = document.getElementById('chat-history');

promptForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const prompt = promptInput.value.trim();
    const response = await fetch('/chatbot', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({prompt})
    });
    const data = await response.json();
    appendChat(prompt, data.answer);
    promptInput.value = '';
});

function appendChat(userQuestion, aiAnswer) {
    const div = document.createElement('div');
    div.innerHTML = `<strong>You:</strong> ${userQuestion}<br><strong>AI:</strong> ${aiAnswer}`;
    chatHistory.appendChild(div)
}