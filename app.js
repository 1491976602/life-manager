// 数据存储键名
const STORAGE_KEYS = {
    RECORDS_1: 'lm_account_records_1',
    RECORDS_2: 'lm_account_records_2',
    RECORDS_3: 'lm_account_records_3',
    CATEGORIES: 'lm_categories',
    BUDGET_1: 'lm_budget_1',
    BUDGET_2: 'lm_budget_2',
    BUDGET_3: 'lm_budget_3',
    WEIGHT_RECORDS: 'lm_weight_records',
    WEIGHT_GOAL: 'lm_weight_goal',
    CURRENT_BOOK: 'lm_current_book'
};

const BOOK_NAMES = ['账本1', '账本2', '账本3'];
const BOOK_NAMES_KEY = 'lm_book_names';

function getBookNames() {
    const data = localStorage.getItem(BOOK_NAMES_KEY);
    return data ? JSON.parse(data) : ['账本1', '账本2', '账本3'];
}

function saveBookNames(names) {
    localStorage.setItem(BOOK_NAMES_KEY, JSON.stringify(names));
}
const STORAGE_KEYS_BY_BOOK = {
    1: STORAGE_KEYS.RECORDS_1,
    2: STORAGE_KEYS.RECORDS_2,
    3: STORAGE_KEYS.RECORDS_3
};

const BUDGET_KEYS_BY_BOOK = {
    1: STORAGE_KEYS.BUDGET_1,
    2: STORAGE_KEYS.BUDGET_2,
    3: STORAGE_KEYS.BUDGET_3
};

// 默认分类
const DEFAULT_CATEGORIES = {
    expense: ['餐饮', '交通', '购物', '娱乐', '居住', '医疗', '通讯', '其他'],
    income: ['工资', '奖金', '投资', '兼职', '其他']
};

// 分类图标
const CATEGORY_ICONS = {
    expense: ['🍜', '🚗', '🛒', '🎮', '🏠', '💊', '📱', '📦'],
    income: ['💵', '🎁', '📈', '💼', '📦']
};

// 全局状态
let currentMonth = new Date();
let currentCategoryType = 'expense';
let currentBook = 1; // 当前账本
let reportPeriod = 'month';
let reportChartType = 'expense';
let currentMonthlyChartType = 'expense'; // 年度视图月度对比图表类型
let deferredPrompt = null;

// 获取当前账本的记录
function getRecords() {
    const key = STORAGE_KEYS_BY_BOOK[currentBook];
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
}

function saveRecords(records) {
    const key = STORAGE_KEYS_BY_BOOK[currentBook];
    localStorage.setItem(key, JSON.stringify(records));
}

// 获取所有账本的记录（用于搜索）
function getAllBooksRecords() {
    const allRecords = [];
    for (let i = 1; i <= 3; i++) {
        const data = localStorage.getItem(STORAGE_KEYS_BY_BOOK[i]);
        if (data) {
            const records = JSON.parse(data);
            records.forEach(r => {
                allRecords.push({ ...r, book: i });
            });
        }
    }
    return allRecords;
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    initBook();
    initCategories();
    initMonthDisplay();
    updateBudget();
    updateMonthSummary();
    renderCategoryList();
    renderRecordList();
    initWeightModule();
    initReportModule();
    initSearchModule();
    initTabs();
    initModal();
    initPWA();
    initInstallBanner();
});

function initBook() {
    const savedBook = localStorage.getItem(STORAGE_KEYS.CURRENT_BOOK);
    if (savedBook) {
        currentBook = parseInt(savedBook);
    }
    updateBookDisplay();
}

function switchBook(bookNum) {
    currentBook = bookNum;
    localStorage.setItem(STORAGE_KEYS.CURRENT_BOOK, bookNum.toString());
    updateBookDisplay();
    updateBudget();
    updateMonthSummary();
    renderCategoryList();
    renderRecordList();
}

function updateBookDisplay() {
    const names = getBookNames();
    document.querySelectorAll('.book-tab').forEach(tab => {
        const bookNum = parseInt(tab.dataset.book);
        tab.textContent = names[bookNum - 1];
        tab.classList.toggle('active', bookNum === currentBook);
    });
    document.getElementById('currentBookName').textContent = names[currentBook - 1];
    
    // 更新报表界面的账本标签
    document.querySelectorAll('.report-book-tab').forEach(tab => {
        const bookNum = parseInt(tab.dataset.book);
        tab.textContent = names[bookNum - 1];
        tab.classList.toggle('active', bookNum === currentBook);
    });
}

function switchBookAndRefresh(bookNum) {
    switchBook(bookNum);
    updateReportDisplay();
}

function showBookNameEditor() {
    const names = getBookNames();
    showModal('设置账本名称', `
        <div class="form-group">
            <label>账本1名称</label>
            <input type="text" id="bookName1" value="${names[0]}" maxlength="10">
        </div>
        <div class="form-group">
            <label>账本2名称</label>
            <input type="text" id="bookName2" value="${names[1]}" maxlength="10">
        </div>
        <div class="form-group">
            <label>账本3名称</label>
            <input type="text" id="bookName3" value="${names[2]}" maxlength="10">
        </div>
        <div class="form-actions">
            <button class="btn-cancel" onclick="closeModal()">取消</button>
            <button class="btn-submit" onclick="saveBookNameSettings()">保存</button>
        </div>
    `);
}

function saveBookNameSettings() {
    const names = [
        document.getElementById('bookName1').value.trim() || '账本1',
        document.getElementById('bookName2').value.trim() || '账本2',
        document.getElementById('bookName3').value.trim() || '账本3'
    ];
    saveBookNames(names);
    updateBookDisplay();
    closeModal();
}

// 标签页切换
function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            btn.classList.add('active');
            const tabId = btn.dataset.tab + 'Tab';
            document.getElementById(tabId).classList.add('active');
            
            if (tabId === 'reportTab') {
                updateReportDisplay();
            }
        });
    });

    document.querySelectorAll('.cat-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.cat-tab').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategoryType = btn.dataset.type;
            renderCategoryList();
        });
    });
}

// 分类管理
function initCategories() {
    const categories = getCategories();
    if (!categories.expense || categories.expense.length === 0) {
        saveCategories(DEFAULT_CATEGORIES);
    }
}

function getCategories() {
    const data = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return data ? JSON.parse(data) : DEFAULT_CATEGORIES;
}

function saveCategories(categories) {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
}

function renderCategoryList() {
    const container = document.getElementById('categoryList');
    const categories = getCategories()[currentCategoryType] || [];
    
    if (categories.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>暂无分类</p></div>';
        return;
    }

    container.innerHTML = categories.map((cat, index) => `
        <div class="category-item">
            <span>${CATEGORY_ICONS[currentCategoryType][index] || '📦'}</span>
            <span>${cat}</span>
            <button class="delete-cat" onclick="deleteCategory(${index})">×</button>
        </div>
    `).join('');
}

function deleteCategory(index) {
    const categories = getCategories();
    categories[currentCategoryType].splice(index, 1);
    saveCategories(categories);
    renderCategoryList();
}

document.getElementById('addCategory').addEventListener('click', () => {
    showModal('添加分类', `
        <div class="form-group">
            <label>分类名称</label>
            <input type="text" id="newCategoryName" placeholder="请输入分类名称" maxlength="10">
        </div>
        <div class="form-actions">
            <button class="btn-cancel" onclick="closeModal()">取消</button>
            <button class="btn-submit" onclick="submitAddCategory()">添加</button>
        </div>
    `);
});

function submitAddCategory() {
    const name = document.getElementById('newCategoryName').value.trim();
    if (!name) {
        alert('请输入分类名称');
        return;
    }
    
    const categories = getCategories();
    if (!categories[currentCategoryType]) {
        categories[currentCategoryType] = [];
    }
    categories[currentCategoryType].push(name);
    saveCategories(categories);
    
    const iconCount = CATEGORY_ICONS[currentCategoryType].length;
    CATEGORY_ICONS[currentCategoryType].push(CATEGORY_ICONS[currentCategoryType][iconCount - 1] || '📦');
    
    closeModal();
    renderCategoryList();
}

// 预算管理
function getBudget() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const key = `budget_${year}_${month}`;
    const data = localStorage.getItem(BUDGET_KEYS_BY_BOOK[currentBook]);
    const budgets = data ? JSON.parse(data) : {};
    return budgets[key] || 0;
}

function saveBudget(amount) {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const key = `budget_${year}_${month}`;
    const data = localStorage.getItem(BUDGET_KEYS_BY_BOOK[currentBook]);
    const budgets = data ? JSON.parse(data) : {};
    budgets[key] = amount;
    localStorage.setItem(BUDGET_KEYS_BY_BOOK[currentBook], JSON.stringify(budgets));
}

function updateBudget() {
    const budget = getBudget();
    document.getElementById('monthBudget').textContent = `¥${budget.toFixed(2)}`;
}

document.getElementById('editBudget').addEventListener('click', () => {
    showModal('设置本月预算', `
        <div class="form-group">
            <label>预算金额 (¥)</label>
            <input type="number" id="budgetAmount" placeholder="例如: 3000" step="0.01" min="0" value="${getBudget()}">
        </div>
        <div class="form-actions">
            <button class="btn-cancel" onclick="closeModal()">取消</button>
            <button class="btn-submit" onclick="submitBudget()">保存</button>
        </div>
    `);
});

function submitBudget() {
    const amount = parseFloat(document.getElementById('budgetAmount').value);
    if (isNaN(amount) || amount < 0) {
        alert('请输入有效金额');
        return;
    }
    saveBudget(amount);
    closeModal();
    updateBudget();
    updateMonthSummary();
}

// 月份选择
function initMonthDisplay() {
    updateMonthDisplay();
}

document.getElementById('prevMonth').addEventListener('click', () => {
    currentMonth.setMonth(currentMonth.getMonth() - 1);
    updateMonthDisplay();
    updateBudget();
    updateMonthSummary();
    renderRecordList();
});

document.getElementById('nextMonth').addEventListener('click', () => {
    currentMonth.setMonth(currentMonth.getMonth() + 1);
    updateMonthDisplay();
    updateBudget();
    updateMonthSummary();
    renderRecordList();
});

function updateMonthDisplay() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    document.getElementById('monthDisplay').textContent = `${year}年${month}月`;
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
    });
}

// 记账记录
function updateMonthSummary() {
    const records = getRecords();
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const monthRecords = records.filter(r => {
        const d = new Date(r.date);
        return d.getFullYear() === year && d.getMonth() === month;
    });

    const income = monthRecords.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
    const expense = monthRecords.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);
    const budget = getBudget();
    const balance = budget - expense;

    document.getElementById('monthIncome').textContent = `¥${income.toFixed(2)}`;
    document.getElementById('monthExpense').textContent = `¥${expense.toFixed(2)}`;
    
    const balanceEl = document.getElementById('monthBalance');
    balanceEl.textContent = `¥${balance.toFixed(2)}`;
    
    const balanceCard = balanceEl.closest('.summary-card');
    if (balance < 0) {
        balanceCard.classList.add('overdue');
    } else {
        balanceCard.classList.remove('overdue');
    }

    // 更新进度条
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    
    if (budget > 0) {
        const percentage = Math.min((expense / budget) * 100, 100);
        progressFill.style.width = `${percentage}%`;
        progressText.textContent = `已花费 ${percentage.toFixed(1)}%`;
        
        if (percentage >= 100) {
            progressFill.classList.add('warning');
        } else {
            progressFill.classList.remove('warning');
        }
    } else {
        progressFill.style.width = '0%';
        progressText.textContent = '请先设置预算';
    }
}

function renderRecordList() {
    const container = document.getElementById('recordList');
    const records = getRecords();
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const monthRecords = records.filter(r => {
        const d = new Date(r.date);
        return d.getFullYear() === year && d.getMonth() === month;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));

    if (monthRecords.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">📝</div>
                <p>本月暂无记录</p>
            </div>
        `;
        return;
    }

    const categories = getCategories();
    container.innerHTML = monthRecords.map(record => {
        const catIndex = categories[record.type].indexOf(record.category);
        const icon = CATEGORY_ICONS[record.type][catIndex] || '📦';
        const date = new Date(record.date);
        const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        
        return `
            <div class="record-item">
                <div class="record-left">
                    <div class="record-icon ${record.type}">${icon}</div>
                    <div class="record-info">
                        <div class="record-category">${record.category}</div>
                        <div class="record-note">${record.note || ''}</div>
                    </div>
                </div>
                <div class="record-right">
                    <div class="record-amount ${record.type}">
                        ${record.type === 'income' ? '+' : '-'}${record.amount.toFixed(2)}
                    </div>
                    <div class="record-date">${dateStr}</div>
                </div>
                <button class="delete-btn" onclick="deleteRecord('${record.id}')">×</button>
            </div>
        `;
    }).join('');
}

function deleteRecord(id) {
    if (!confirm('确定删除这条记录？')) return;
    const records = getRecords().filter(r => r.id !== id);
    saveRecords(records);
    updateMonthSummary();
    renderRecordList();
}

document.getElementById('addRecord').addEventListener('click', () => {
    const categories = getCategories();
    const catOptions = categories[currentCategoryType].map((cat, i) => 
        `<option value="${cat}">${CATEGORY_ICONS[currentCategoryType][i] || ''} ${cat}</option>`
    ).join('');

    const today = new Date();
    const defaultDate = today.getFullYear() + '-' + 
        String(today.getMonth() + 1).padStart(2, '0') + '-' + 
        String(today.getDate()).padStart(2, '0');

    showModal('添加记录', `
        <div class="form-group">
            <label>日期</label>
            <input type="date" id="recordDate" value="${defaultDate}">
        </div>
        <div class="form-group">
            <label>类型</label>
            <select id="recordType" onchange="updateRecordCategories()">
                <option value="expense" ${currentCategoryType === 'expense' ? 'selected' : ''}>支出</option>
                <option value="income" ${currentCategoryType === 'income' ? 'selected' : ''}>收入</option>
            </select>
        </div>
        <div class="form-group">
            <label>金额</label>
            <input type="number" id="recordAmount" placeholder="0.00" step="0.01" min="0">
        </div>
        <div class="form-group">
            <label>分类</label>
            <select id="recordCategory">${catOptions}</select>
        </div>
        <div class="form-group">
            <label>备注</label>
            <input type="text" id="recordNote" placeholder="可选" maxlength="50">
        </div>
        <div class="form-actions">
            <button class="btn-cancel" onclick="closeModal()">取消</button>
            <button class="btn-submit" onclick="submitAddRecord()">保存</button>
        </div>
    `);
});

function updateRecordCategories() {
    const type = document.getElementById('recordType').value;
    const categories = getCategories();
    const catSelect = document.getElementById('recordCategory');
    catSelect.innerHTML = categories[type].map((cat, i) => 
        `<option value="${cat}">${CATEGORY_ICONS[type][i] || ''} ${cat}</option>`
    ).join('');
}

function submitAddRecord() {
    const type = document.getElementById('recordType').value;
    const amount = parseFloat(document.getElementById('recordAmount').value);
    const category = document.getElementById('recordCategory').value;
    const note = document.getElementById('recordNote').value.trim();
    const recordDateStr = document.getElementById('recordDate').value;

    if (!amount || amount <= 0) {
        alert('请输入有效金额');
        return;
    }

    if (!recordDateStr) {
        alert('请选择日期');
        return;
    }

    const records = getRecords();
    // 使用用户选择的日期，但时间使用当前实际时间（精确到分钟）
    const now = new Date();
    const selectedDate = new Date(recordDateStr);
    selectedDate.setHours(now.getHours(), now.getMinutes(), 0, 0);

    records.push({
        id: Date.now().toString(),
        type,
        amount,
        category,
        note,
        date: selectedDate.toISOString()
    });
    saveRecords(records);
    
    closeModal();
    updateMonthSummary();
    renderRecordList();
}

// 减肥模块
function initWeightModule() {
    renderWeightGoal();
    renderWeightList();
    initWeightChart();
}

function getWeightGoal() {
    const data = localStorage.getItem(STORAGE_KEYS.WEIGHT_GOAL);
    return data ? JSON.parse(data) : null;
}

function saveWeightGoal(goal) {
    localStorage.setItem(STORAGE_KEYS.WEIGHT_GOAL, JSON.stringify(goal));
}

function getWeightRecords() {
    const data = localStorage.getItem(STORAGE_KEYS.WEIGHT_RECORDS);
    return data ? JSON.parse(data) : [];
}

function saveWeightRecords(records) {
    localStorage.setItem(STORAGE_KEYS.WEIGHT_RECORDS, JSON.stringify(records));
}

function renderWeightGoal() {
    const goal = getWeightGoal();
    const records = getWeightRecords();
    const current = records.length > 0 ? records[records.length - 1].weight : null;

    document.getElementById('targetWeight').textContent = goal ? `${goal} kg` : '--';
    document.getElementById('currentWeight').textContent = current ? `${current} kg` : '--';

    if (goal && current) {
        const remaining = current - goal;
        document.getElementById('remainingWeight').textContent = `${remaining.toFixed(1)} kg`;
    } else {
        document.getElementById('remainingWeight').textContent = '--';
    }

    // BMI计算: 体重(kg) / 身高(m)^2，身高固定159cm
    if (current) {
        const height = 1.59;
        const bmi = current / (height * height);
        document.getElementById('currentBMI').textContent = bmi.toFixed(1);
    } else {
        document.getElementById('currentBMI').textContent = '--';
    }
}

function renderWeightList() {
    const container = document.getElementById('weightList');
    const records = getWeightRecords().sort((a, b) => new Date(b.date) - new Date(a.date));

    if (records.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">⚖️</div>
                <p>暂无体重记录</p>
            </div>
        `;
        return;
    }

    container.innerHTML = records.map((record, index) => {
        const prevWeight = records[index + 1]?.weight;
        let changeClass = '';
        let changeText = '';

        if (prevWeight) {
            const diff = record.weight - prevWeight;
            if (diff < 0) {
                changeClass = 'down';
                changeText = `↓ ${Math.abs(diff).toFixed(1)}`;
            } else if (diff > 0) {
                changeClass = 'up';
                changeText = `↑ ${diff.toFixed(1)}`;
            } else {
                changeText = '持平';
            }
        }

        const date = new Date(record.date);
        const dateStr = `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;

        return `
            <div class="weight-item">
                <div class="weight-info">
                    <div class="weight-date">${dateStr}</div>
                    <span class="weight-change ${changeClass}">${changeText}</span>
                </div>
                <div class="weight-value">${record.weight} kg</div>
                <button class="delete-btn" onclick="deleteWeight('${record.id}')">×</button>
            </div>
        `;
    }).join('');
}

function deleteWeight(id) {
    if (!confirm('确定删除这条记录？')) return;
    const records = getWeightRecords().filter(r => r.id !== id);
    saveWeightRecords(records);
    renderWeightGoal();
    renderWeightList();
    updateWeightChart();
}

document.getElementById('setGoal').addEventListener('click', () => {
    const goal = getWeightGoal() || '';
    showModal('设置目标体重', `
        <div class="form-group">
            <label>目标体重 (kg)</label>
            <input type="number" id="weightGoal" placeholder="例如: 65.0" step="0.1" min="30" max="200" value="${goal}">
        </div>
        <div class="form-actions">
            <button class="btn-cancel" onclick="closeModal()">取消</button>
            <button class="btn-submit" onclick="submitWeightGoal()">保存</button>
        </div>
    `);
});

function submitWeightGoal() {
    const goal = parseFloat(document.getElementById('weightGoal').value);
    if (!goal || goal <= 0) {
        alert('请输入有效体重');
        return;
    }
    saveWeightGoal(goal);
    closeModal();
    renderWeightGoal();
}

document.getElementById('addWeight').addEventListener('click', () => {
    showModal('记录体重', `
        <div class="form-group">
            <label>当前体重 (kg)</label>
            <input type="number" id="newWeight" placeholder="例如: 70.5" step="0.1" min="30" max="200">
        </div>
        <div class="form-actions">
            <button class="btn-cancel" onclick="closeModal()">取消</button>
            <button class="btn-submit" onclick="submitAddWeight()">保存</button>
        </div>
    `);
});

function submitAddWeight() {
    const weight = parseFloat(document.getElementById('newWeight').value);
    if (!weight || weight <= 0) {
        alert('请输入有效体重');
        return;
    }

    const records = getWeightRecords();
    records.push({
        id: Date.now().toString(),
        weight,
        date: new Date().toISOString()
    });
    saveWeightRecords(records);
    
    closeModal();
    renderWeightGoal();
    renderWeightList();
    updateWeightChart();
}

// 体重图表
function initWeightChart() {
    const canvas = document.getElementById('weightChart');
    const ctx = canvas.getContext('2d');
    drawWeightChart(ctx);
}

function updateWeightChart() {
    const canvas = document.getElementById('weightChart');
    const ctx = canvas.getContext('2d');
    drawWeightChart(ctx);
}

function drawWeightChart(ctx) {
    const records = getWeightRecords().slice(-7).reverse();
    const canvas = ctx.canvas;
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);
    
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    const padding = { top: 20, right: 20, bottom: 30, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // 背景
    ctx.fillStyle = '#252542';
    ctx.fillRect(0, 0, width, height);

    if (records.length === 0) {
        ctx.fillStyle = '#a0a0b0';
        ctx.font = '14px Noto Sans SC';
        ctx.textAlign = 'center';
        ctx.fillText('暂无数据', width / 2, height / 2);
        return;
    }

    const weights = records.map(r => r.weight);
    const minWeight = Math.floor(Math.min(...weights) - 2);
    const maxWeight = Math.ceil(Math.max(...weights) + 2);

    // 网格线
    ctx.strokeStyle = '#3a3a5c';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartHeight / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();

        const weight = maxWeight - ((maxWeight - minWeight) / 4) * i;
        ctx.fillStyle = '#a0a0b0';
        ctx.font = '11px Noto Sans SC';
        ctx.textAlign = 'right';
        ctx.fillText(weight.toFixed(0), padding.left - 8, y + 4);
    }

    // 绘制曲线
    if (records.length > 1) {
        const goal = getWeightGoal();
        
        // 目标线
        if (goal && goal >= minWeight && goal <= maxWeight) {
            const goalY = padding.top + chartHeight - ((goal - minWeight) / (maxWeight - minWeight)) * chartHeight;
            ctx.strokeStyle = '#ff6b9d';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(padding.left, goalY);
            ctx.lineTo(width - padding.right, goalY);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = '#ff6b9d';
            ctx.font = '10px Noto Sans SC';
            ctx.textAlign = 'left';
            ctx.fillText(`目标: ${goal}kg`, width - padding.right + 5, goalY + 4);
        }

        // 数据线
        ctx.strokeStyle = '#00d9ff';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();

        records.forEach((record, i) => {
            const x = padding.left + (chartWidth / (records.length - 1)) * i;
            const y = padding.top + chartHeight - ((record.weight - minWeight) / (maxWeight - minWeight)) * chartHeight;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // 数据点
        records.forEach((record, i) => {
            const x = padding.left + (chartWidth / (records.length - 1)) * i;
            const y = padding.top + chartHeight - ((record.weight - minWeight) / (maxWeight - minWeight)) * chartHeight;
            
            ctx.fillStyle = '#00d9ff';
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#1a1a2e';
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
        });
    } else if (records.length === 1) {
        const x = width / 2;
        const y = height / 2;
        
        ctx.fillStyle = '#00d9ff';
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = records[0].weight + ' kg';
        ctx.font = '14px Noto Sans SC';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.fillText(records[0].weight + ' kg', x, y + 25);
    }
}

// 模态框
function showModal(title, content) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = content;
    document.getElementById('modal').classList.add('show');
}

function closeModal() {
    document.getElementById('modal').classList.remove('show');
}

function initModal() {
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('modal').addEventListener('click', (e) => {
        if (e.target.id === 'modal') closeModal();
    });
}

// PWA 安装
function initPWA() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        setTimeout(() => {
            document.getElementById('installBanner').classList.add('show');
        }, 3000);
    });
}

function initInstallBanner() {
    document.getElementById('installBtn').addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            deferredPrompt = null;
            document.getElementById('installBanner').classList.remove('show');
        }
    });

    document.getElementById('dismissBanner').addEventListener('click', () => {
        document.getElementById('installBanner').classList.remove('show');
    });
}

// 窗口调整时重绘图表
window.addEventListener('resize', () => {
    setTimeout(updateWeightChart, 100);
    setTimeout(drawDailyChart, 100);
    setTimeout(drawPieChart, 100);
    setTimeout(drawMonthlyChart, 100);
});

// 报表模块
function initReportModule() {
    initReportTabs();
    initReportDateSelector();
    updateReportDisplay();
}

function initReportTabs() {
    document.querySelectorAll('.ym-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.ym-tab').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            reportPeriod = btn.dataset.period;
            updateReportDisplay();
        });
    });

    document.querySelectorAll('.daily-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.daily-tab').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            reportChartType = btn.dataset.type;
            drawDailyChart();
        });
    });

    document.querySelectorAll('.monthly-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.monthly-tab').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentMonthlyChartType = btn.dataset.type;
            drawMonthlyChart();
        });
    });

    document.querySelectorAll('.category-report-section .cat-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-report-section .cat-tab').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategoryType = btn.dataset.type;
            drawPieChart();
            renderCategoryReport();
        });
    });
}

function initReportDateSelector() {
    document.getElementById('reportPrevMonth').addEventListener('click', () => {
        if (reportPeriod === 'month') {
            currentMonth.setMonth(currentMonth.getMonth() - 1);
        } else {
            currentMonth.setFullYear(currentMonth.getFullYear() - 1);
        }
        updateReportDisplay();
    });

    document.getElementById('reportNextMonth').addEventListener('click', () => {
        if (reportPeriod === 'month') {
            currentMonth.setMonth(currentMonth.getMonth() + 1);
        } else {
            currentMonth.setFullYear(currentMonth.getFullYear() + 1);
        }
        updateReportDisplay();
    });
}

function updateReportDisplay() {
    updateReportDate();
    
    if (reportPeriod === 'month') {
        document.getElementById('monthlyView').style.display = 'block';
        document.getElementById('yearlyView').style.display = 'none';
        updateMonthlySummary();
        drawDailyChart();
    } else {
        document.getElementById('monthlyView').style.display = 'none';
        document.getElementById('yearlyView').style.display = 'block';
        updateYearlySummary();
        drawMonthlyChart();
    }
    
    drawPieChart();
    renderCategoryReport();
    renderMonthlyReportTable();
}

function updateReportDate() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1;
    if (reportPeriod === 'month') {
        document.getElementById('reportMonthDisplay').textContent = `${year}-${month.toString().padStart(2, '0')}`;
    } else {
        document.getElementById('reportMonthDisplay').textContent = `${year}`;
    }
}

function updateMonthlySummary() {
    const records = getRecords();
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const monthRecords = records.filter(r => {
        const d = new Date(r.date);
        return d.getFullYear() === year && d.getMonth() === month;
    });

    const expense = monthRecords.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);
    const income = monthRecords.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
    const balance = income - expense;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dailyAvg = expense / daysInMonth;

    document.getElementById('reportExpense').textContent = `¥${expense.toFixed(2)}`;
    document.getElementById('reportIncome').textContent = `¥${income.toFixed(2)}`;
    document.getElementById('reportBalance').textContent = `¥${balance.toFixed(2)}`;
    document.getElementById('reportDailyAvg').textContent = `¥${dailyAvg.toFixed(2)}`;
}

function updateYearlySummary() {
    const records = getRecords();
    const year = currentMonth.getFullYear();

    const yearRecords = records.filter(r => {
        const d = new Date(r.date);
        return d.getFullYear() === year;
    });

    const expense = yearRecords.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);
    const income = yearRecords.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
    const balance = income - expense;
    const avgExpense = expense / 12;

    document.getElementById('yearlyExpense').textContent = `¥${expense.toFixed(2)}`;
    document.getElementById('yearlyIncome').textContent = `¥${income.toFixed(2)}`;
    document.getElementById('yearlyBalance').textContent = `¥${balance.toFixed(2)}`;
    document.getElementById('yearlyAvgExpense').textContent = `¥${avgExpense.toFixed(2)}`;
    document.getElementById('yearlyReimburse').textContent = '¥0.00';
    document.getElementById('yearlyRefund').textContent = '¥0.00';
}

function drawDailyChart() {
    const canvas = document.getElementById('dailyChart');
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);
    
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    const padding = { top: 20, right: 15, bottom: 25, left: 45 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    ctx.fillStyle = '#252542';
    ctx.fillRect(0, 0, width, height);

    const records = getRecords();
    let filteredRecords = [];

    if (reportPeriod === 'month') {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        filteredRecords = records.filter(r => {
            const d = new Date(r.date);
            return d.getFullYear() === year && d.getMonth() === month;
        });
    }

    const dailyData = {};
    filteredRecords.forEach(r => {
        const date = new Date(r.date);
        const day = date.getDate();
        if (!dailyData[day]) {
            dailyData[day] = { expense: 0, income: 0 };
        }
        dailyData[day][r.type] += r.amount;
    });

    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const expensePoints = [];
    const incomePoints = [];
    
    for (let i = 1; i <= daysInMonth; i++) {
        expensePoints.push({
            day: i,
            value: dailyData[i] ? dailyData[i].expense : 0
        });
        incomePoints.push({
            day: i,
            value: dailyData[i] ? dailyData[i].income : 0
        });
    }

    const maxExpense = Math.max(...expensePoints.map(p => p.value), 1);
    const maxIncome = Math.max(...incomePoints.map(p => p.value), 1);

    let maxValue, minValue, valueRange;
    if (reportChartType === 'expense') {
        maxValue = maxExpense;
        minValue = 0;
    } else if (reportChartType === 'income') {
        maxValue = maxIncome;
        minValue = 0;
    } else {
        maxValue = Math.max(maxExpense, maxIncome);
        minValue = 0;
    }
    valueRange = maxValue || 1;

    ctx.strokeStyle = '#3a3a5c';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
        const y = padding.top + (chartHeight / 4) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();

        const value = Math.round(maxValue - (valueRange / 4) * i);
        ctx.fillStyle = '#a0a0b0';
        ctx.font = '10px Noto Sans SC';
        ctx.textAlign = 'right';
        ctx.fillText(value.toString(), padding.left - 5, y + 3);
    }

    const getX = (day) => padding.left + ((day - 1) / (daysInMonth - 1 || 1)) * chartWidth;
    const getY = (value) => padding.top + chartHeight - (value / valueRange) * chartHeight;

    // 绘制支出折线
    const drawLine = (points, color, showLine) => {
        if (showLine) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 2.5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            
            let started = false;
            points.forEach((point, i) => {
                if (point.value > 0) {
                    const x = getX(point.day);
                    const y = getY(point.value);
                    if (!started) {
                        ctx.moveTo(x, y);
                        started = true;
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
            });
            ctx.stroke();
        }

        // 绘制数据点
        points.forEach(point => {
            if (point.value > 0) {
                const x = getX(point.day);
                const y = getY(point.value);
                
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = '#252542';
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    };

    if (reportChartType === 'all') {
        drawLine(expensePoints, '#ff4757', true);
        drawLine(incomePoints, '#00ff88', true);
    } else if (reportChartType === 'expense') {
        drawLine(expensePoints, '#ff4757', true);
    } else {
        drawLine(incomePoints, '#00ff88', true);
    }

    // 绘制日期标签 - 每天显示
    for (let i = 1; i <= daysInMonth; i++) {
        const x = getX(i);
        ctx.fillStyle = '#a0a0b0';
        ctx.font = '9px Noto Sans SC';
        ctx.textAlign = 'center';
        ctx.fillText(i.toString(), x, height - 5);
    }

    // 图例
    const legendY = height - 5;
    if (reportChartType === 'all') {
        ctx.fillStyle = '#ff4757';
        ctx.beginPath();
        ctx.arc(padding.left + 20, legendY - 8, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#a0a0b0';
        ctx.font = '10px Noto Sans SC';
        ctx.textAlign = 'left';
        ctx.fillText('支出', padding.left + 28, legendY - 5);

        ctx.fillStyle = '#00ff88';
        ctx.beginPath();
        ctx.arc(padding.left + 70, legendY - 8, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#a0a0b0';
        ctx.fillText('收入', padding.left + 78, legendY - 5);
    }
}

function drawPieChart() {
    const canvas = document.getElementById('pieChart');
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = 200 * dpr;
    canvas.height = 200 * dpr;
    ctx.scale(dpr, dpr);

    const size = 200;
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = 70;
    const innerRadius = 40;

    ctx.fillStyle = '#252542';
    ctx.fillRect(0, 0, size, size);

    const records = getRecords();
    let filteredRecords = records;

    if (reportPeriod === 'month') {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        filteredRecords = records.filter(r => {
            const d = new Date(r.date);
            return d.getFullYear() === year && d.getMonth() === month && r.type === currentCategoryType;
        });
    } else {
        const year = currentMonth.getFullYear();
        filteredRecords = records.filter(r => {
            const d = new Date(r.date);
            return d.getFullYear() === year && r.type === currentCategoryType;
        });
    }

    const categoryTotals = {};
    filteredRecords.forEach(r => {
        if (!categoryTotals[r.category]) {
            categoryTotals[r.category] = 0;
        }
        categoryTotals[r.category] += r.amount;
    });

    const categories = Object.keys(categoryTotals);
    const total = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);

    if (categories.length === 0) {
        ctx.fillStyle = '#a0a0b0';
        ctx.font = '12px Noto Sans SC';
        ctx.textAlign = 'center';
        ctx.fillText('暂无数据', centerX, centerY);
        return;
    }

    const colors = [
        '#ff9f43', '#ee5a24', '#00d9ff', '#00ff88', '#ff6b9d', 
        '#a29bfe', '#fd79a8', '#74b9ff', '#55efc4', '#ffeaa7'
    ];

    let startAngle = -Math.PI / 2;

    categories.forEach((cat, index) => {
        const amount = categoryTotals[cat];
        const percentage = (amount / total) * 100;
        if (percentage < 2) return;

        const endAngle = startAngle + (percentage / 100) * Math.PI * 2;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();

        const color = colors[index % colors.length];
        ctx.fillStyle = color;
        ctx.fill();

        startAngle = endAngle;
    });

    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#252542';
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Noto Sans SC';
    ctx.textAlign = 'center';
    ctx.fillText('支出', centerX, centerY - 5);
    ctx.fillStyle = '#a0a0b0';
    ctx.font = '12px Noto Sans SC';
    ctx.fillText('比例', centerX, centerY + 12);
}

function renderCategoryReport() {
    const container = document.getElementById('categoryReportList');
    const records = getRecords();
    let filteredRecords = records;
    let compareRecords = records;

    const currentYear = currentMonth.getFullYear();
    const currentMonthNum = currentMonth.getMonth();
    
    // 当前周期数据
    if (reportPeriod === 'month') {
        filteredRecords = records.filter(r => {
            const d = new Date(r.date);
            return d.getFullYear() === currentYear && d.getMonth() === currentMonthNum && r.type === currentCategoryType;
        });
        // 对比数据：上个月
        const prevMonthDate = new Date(currentYear, currentMonthNum - 1, 1);
        compareRecords = records.filter(r => {
            const d = new Date(r.date);
            return d.getFullYear() === prevMonthDate.getFullYear() && d.getMonth() === prevMonthDate.getMonth() && r.type === currentCategoryType;
        });
    } else {
        filteredRecords = records.filter(r => {
            const d = new Date(r.date);
            return d.getFullYear() === currentYear && r.type === currentCategoryType;
        });
        // 对比数据：去年
        compareRecords = records.filter(r => {
            const d = new Date(r.date);
            return d.getFullYear() === currentYear - 1 && r.type === currentCategoryType;
        });
    }

    const categoryTotals = {};
    filteredRecords.forEach(r => {
        if (!categoryTotals[r.category]) {
            categoryTotals[r.category] = 0;
        }
        categoryTotals[r.category] += r.amount;
    });

    const compareTotals = {};
    compareRecords.forEach(r => {
        if (!compareTotals[r.category]) {
            compareTotals[r.category] = 0;
        }
        compareTotals[r.category] += r.amount;
    });

    const total = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);
    const sortedCategories = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1]);

    const colors = [
        '#ff9f43', '#ee5a24', '#00d9ff', '#00ff88', '#ff6b9d', 
        '#a29bfe', '#fd79a8', '#74b9ff', '#55efc4', '#ffeaa7'
    ];

    const icons = currentCategoryType === 'expense' 
        ? ['🍜', '🚗', '🛒', '🎮', '🏠', '💊', '📱', '📦', '🔧', '💍']
        : ['💵', '🎁', '📈', '💼', '📦', '🎯', '💰', '💳', '🎪', '🎨'];

    if (sortedCategories.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>暂无数据</p>
            </div>
        `;
        return;
    }

    container.innerHTML = sortedCategories.map(([category, amount], index) => {
        const percentage = (amount / total) * 100;
        const compareAmount = compareTotals[category] || 0;
        const change = amount - compareAmount;
        const changePercent = compareAmount > 0 ? ((change / compareAmount) * 100).toFixed(2) : '0';
        const color = colors[index % colors.length];
        const icon = icons[index % icons.length];
        const isUp = change >= 0;
        
        return `
            <div class="category-report-item">
                <div class="cat-report-icon" style="background: ${color}30; color: ${color}">${icon}</div>
                <div class="cat-report-info">
                    <div class="cat-report-name">${category}</div>
                    <div class="cat-report-percent">${percentage >= 2 ? percentage.toFixed(2) : '< 2'}%</div>
                    <div class="cat-report-bar">
                        <div class="cat-report-bar-fill" style="width: ${Math.min(percentage, 100)}%; background: ${color}"></div>
                    </div>
                </div>
                <div class="cat-report-amount">
                    <div class="cat-report-value" style="color: ${color}">¥${amount.toFixed(2)}</div>
                    <div class="cat-report-change ${isUp ? 'up' : 'down'}">
                        ${isUp ? '▲' : '▼'}${change.toFixed(2)}
                    </div>
                </div>
                <div class="cat-report-compare">
                    <div class="cat-report-compare-value">¥${compareAmount.toFixed(2)}</div>
                </div>
            </div>
        `;
    }).join('');
}

function drawMonthlyChart() {
    const canvas = document.getElementById('monthlyChart');
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;
    ctx.scale(dpr, dpr);
    
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    const padding = { top: 20, right: 15, bottom: 30, left: 45 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    ctx.fillStyle = '#252542';
    ctx.fillRect(0, 0, width, height);

    const records = getRecords();
    const year = currentMonth.getFullYear();

    const monthData = {};
    for (let i = 0; i < 12; i++) {
        monthData[i] = { expense: 0, income: 0 };
    }

    records.forEach(r => {
        const d = new Date(r.date);
        if (d.getFullYear() === year) {
            const month = d.getMonth();
            monthData[month][r.type] += r.amount;
        }
    });

    const months = [];
    const expenseData = [];
    const incomeData = [];
    const balanceData = [];
    
    for (let i = 0; i < 12; i++) {
        months.push(i + 1);
        expenseData.push(monthData[i].expense);
        incomeData.push(monthData[i].income);
        balanceData.push(monthData[i].income - monthData[i].expense);
    }

    let interval = 1000;
    let maxValue, minValue;

    if (currentMonthlyChartType === 'expense') {
        maxValue = Math.max(...expenseData, 1);
        minValue = 0;
    } else if (currentMonthlyChartType === 'income') {
        maxValue = Math.max(...incomeData, 1);
        minValue = 0;
    } else if (currentMonthlyChartType === 'balance') {
        maxValue = Math.max(...balanceData, 1);
        minValue = Math.min(...balanceData, 0);
    } else {
        maxValue = Math.max(...expenseData, ...incomeData, 1);
        minValue = 0;
    }

    const maxTickCount = 6;
    const rawRange = maxValue - minValue || 1;
    
    if (rawRange > interval * maxTickCount) {
        const scale = Math.ceil(rawRange / (interval * maxTickCount));
        interval = interval * Math.ceil(scale / 10) * 10 || interval;
    }
    
    maxValue = Math.ceil(maxValue / interval) * interval;
    const valueRange = maxValue - minValue || interval;

    ctx.strokeStyle = '#3a3a5c';
    ctx.lineWidth = 1;
    
    const tickCount = Math.min(Math.ceil(valueRange / interval) + 1, maxTickCount);
    for (let i = 0; i < tickCount; i++) {
        const y = padding.top + (chartHeight / (tickCount - 1)) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();

        const value = Math.round(maxValue - (valueRange / (tickCount - 1)) * i);
        ctx.fillStyle = '#a0a0b0';
        ctx.font = '10px Noto Sans SC';
        ctx.textAlign = 'right';
        ctx.fillText(value.toString(), padding.left - 5, y + 3);
    }

    const getX = (monthIndex) => padding.left + (monthIndex / 11) * chartWidth;
    const getY = (value) => padding.top + chartHeight - ((value - minValue) / valueRange) * chartHeight;

    const drawArea = (data, color) => {
        ctx.beginPath();
        ctx.moveTo(getX(0), getY(data[0]));
        
        for (let i = 1; i < 12; i++) {
            ctx.lineTo(getX(i), getY(data[i]));
        }
        
        ctx.lineTo(getX(11), padding.top + chartHeight);
        ctx.lineTo(getX(0), padding.top + chartHeight);
        ctx.closePath();

        const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartHeight);
        gradient.addColorStop(0, color + '60');
        gradient.addColorStop(1, color + '10');
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(getX(0), getY(data[0]));
        
        for (let i = 1; i < 12; i++) {
            ctx.lineTo(getX(i), getY(data[i]));
        }
        ctx.stroke();

        data.forEach((value, i) => {
            if (value > 0) {
                const x = getX(i);
                const y = getY(value);
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#252542';
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    };

    if (currentMonthlyChartType === 'all') {
        drawArea(expenseData, '#ff4757');
        drawArea(incomeData, '#00ff88');
    } else if (currentMonthlyChartType === 'expense') {
        drawArea(expenseData, '#ff4757');
    } else if (currentMonthlyChartType === 'income') {
        drawArea(incomeData, '#00ff88');
    } else {
        drawArea(balanceData, '#00d9ff');
    }

    for (let i = 0; i < 12; i++) {
        const x = getX(i);
        ctx.fillStyle = '#a0a0b0';
        ctx.font = '9px Noto Sans SC';
        ctx.textAlign = 'center';
        ctx.fillText(`${i + 1}月`, x, height - 10);
    }

    if (currentMonthlyChartType === 'all') {
        ctx.fillStyle = '#ff4757';
        ctx.beginPath();
        ctx.arc(width - 110, padding.top + 12, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#a0a0b0';
        ctx.font = '10px Noto Sans SC';
        ctx.textAlign = 'left';
        ctx.fillText('支出', width - 102, padding.top + 15);
        
        ctx.fillStyle = '#00ff88';
        ctx.beginPath();
        ctx.arc(width - 55, padding.top + 12, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#a0a0b0';
        ctx.fillText('收入', width - 47, padding.top + 15);
    }
}

function renderMonthlyReportTable() {
    const tbody = document.getElementById('monthlyReportBody');
    const records = getRecords();
    const year = currentMonth.getFullYear();

    const monthData = {};
    for (let i = 0; i < 12; i++) {
        monthData[i] = { expense: 0, income: 0 };
    }

    records.forEach(r => {
        const d = new Date(r.date);
        if (d.getFullYear() === year) {
            const month = d.getMonth();
            monthData[month][r.type] += r.amount;
        }
    });

    let totalIncome = 0;
    let totalExpense = 0;

    const rows = [];
    for (let i = 11; i >= 0; i--) {
        const income = monthData[i].income;
        const expense = monthData[i].expense;
        const balance = income - expense;
        
        totalIncome += income;
        totalExpense += expense;

        rows.push(`
            <tr>
                <td>${i + 1}月</td>
                <td>¥${income.toFixed(2)}</td>
                <td>¥${expense.toFixed(2)}</td>
                <td class="${balance >= 0 ? 'positive' : 'negative'}">¥${balance.toFixed(2)}</td>
            </tr>
        `);
    }

    const avgIncome = totalIncome / 12;
    const avgExpense = totalExpense / 12;
    const avgBalance = avgIncome - avgExpense;

    rows.push(`
        <tr>
            <td>平均</td>
            <td>¥${avgIncome.toFixed(2)}</td>
            <td>¥${avgExpense.toFixed(2)}</td>
            <td class="${avgBalance >= 0 ? 'positive' : 'negative'}">¥${avgBalance.toFixed(2)}</td>
        </tr>
    `);

    tbody.innerHTML = rows.join('');
}

// 搜索模块
function initSearchModule() {
    updateSearchCategories();
    
    document.getElementById('searchKeyword').addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    document.getElementById('searchBtn').addEventListener('click', performSearch);
    document.getElementById('searchType').addEventListener('change', performSearch);
    document.getElementById('searchCategory').addEventListener('change', performSearch);
    document.getElementById('minAmount').addEventListener('input', performSearch);
    document.getElementById('maxAmount').addEventListener('input', performSearch);
    document.getElementById('startDate').addEventListener('change', performSearch);
    document.getElementById('endDate').addEventListener('change', performSearch);
    document.getElementById('resetFilter').addEventListener('click', resetSearchFilters);
}

function updateSearchCategories() {
    const categories = getCategories();
    const select = document.getElementById('searchCategory');
    let options = '<option value="all">全部</option>';
    
    [...categories.expense, ...categories.income].forEach(cat => {
        options += `<option value="${cat}">${cat}</option>`;
    });
    
    select.innerHTML = options;
}

function performSearch() {
    const keyword = document.getElementById('searchKeyword').value.toLowerCase();
    const type = document.getElementById('searchType').value;
    const category = document.getElementById('searchCategory').value;
    const minAmount = parseFloat(document.getElementById('minAmount').value) || 0;
    const maxAmount = parseFloat(document.getElementById('maxAmount').value) || Infinity;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    const records = getRecords();
    
    const filteredRecords = records.filter(record => {
        const d = new Date(record.date);
        const recordDateStr = d.toISOString().split('T')[0];
        
        if (type !== 'all' && record.type !== type) return false;
        if (category !== 'all' && record.category !== category) return false;
        if (record.amount < minAmount || record.amount > maxAmount) return false;
        if (startDate && recordDateStr < startDate) return false;
        if (endDate && recordDateStr > endDate) return false;
        
        if (keyword) {
            const noteMatch = record.note && record.note.toLowerCase().includes(keyword);
            const categoryMatch = record.category.toLowerCase().includes(keyword);
            return noteMatch || categoryMatch;
        }
        
        return true;
    });

    renderSearchResults(filteredRecords);
}

function renderSearchResults(records) {
    const container = document.getElementById('searchRecordList');
    const resultCount = document.getElementById('searchResultCount');
    const totalAmount = document.getElementById('searchTotalAmount');

    const total = records.reduce((sum, r) => sum + (r.type === 'expense' ? -r.amount : r.amount), 0);

    resultCount.textContent = `共 ${records.length} 条结果`;
    totalAmount.textContent = `总计 ${total >= 0 ? '+' : ''}¥${total.toFixed(2)}`;

    if (records.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>暂无匹配的记录</p>
            </div>
        `;
        return;
    }

    const sortedRecords = [...records].sort((a, b) => new Date(b.date) - new Date(a.date));

    const colors = ['#ff9f43', '#ee5a24', '#00d9ff', '#00ff88', '#ff6b9d', 
                   '#a29bfe', '#fd79a8', '#74b9ff', '#55efc4', '#ffeaa7'];
    const icons = ['🍜', '🚗', '🛒', '🎮', '🏠', '💊', '📱', '📦', '💵', '🎁'];

    container.innerHTML = sortedRecords.map((record, index) => {
        const d = new Date(record.date);
        const dateStr = `${d.getMonth() + 1}月${d.getDate()}日`;
        const color = colors[index % colors.length];
        const icon = icons[index % icons.length];

        return `
            <div class="search-record-item">
                <div class="search-record-icon" style="background: ${color}30; color: ${color}">${icon}</div>
                <div class="search-record-info">
                    <div class="search-record-title">
                        <span class="search-record-category">${record.category}</span>
                        <span class="search-record-type">${record.type === 'expense' ? '支出' : '收入'}</span>
                    </div>
                    ${record.note ? `<div class="search-record-note">${record.note}</div>` : ''}
                    <div class="search-record-meta">${dateStr}</div>
                </div>
                <div class="search-record-amount">
                    <div class="search-record-value ${record.type}">
                        ${record.type === 'expense' ? '-' : '+'}¥${record.amount.toFixed(2)}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function resetSearchFilters() {
    document.getElementById('searchKeyword').value = '';
    document.getElementById('searchType').value = 'all';
    document.getElementById('searchCategory').value = 'all';
    document.getElementById('minAmount').value = '';
    document.getElementById('maxAmount').value = '';
    document.getElementById('startDate').value = '';
    document.getElementById('endDate').value = '';
    performSearch();
}