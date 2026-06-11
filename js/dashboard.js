import { supabase } from './supabase.js'

const transactionForm = document.getElementById('transaction-form');
const txTypeInput = document.getElementById('tx-type');
const txCategoryInput = document.getElementById('tx-category');
const txAmountInput = document.getElementById('tx-amount');
const txDateInput = document.getElementById('tx-date');
const txDescInput = document.getElementById('tx-desc');
const badgeList = document.getElementById('badge-list');

let currentUser = null;
let latestTransactions = [];
let latestBudgets = [];

const badgeIcons = {
    sprout: `
        <svg viewBox="0 0 64 64" aria-hidden="true">
            <path d="M32 51V29" />
            <path d="M31 31C20 31 13 24 13 13c11 0 18 7 18 18Z" />
            <path d="M33 26C34 16 42 10 52 11c-1 10-8 16-19 15Z" />
            <path d="M22 52h20" />
        </svg>
    `,
    shield: `
        <svg viewBox="0 0 64 64" aria-hidden="true">
            <path d="M32 8 51 15v14c0 13-8 22-19 28C21 51 13 42 13 29V15l19-7Z" />
            <path d="m23 31 6 6 13-14" />
        </svg>
    `,
    ledger: `
        <svg viewBox="0 0 64 64" aria-hidden="true">
            <path d="M16 10h29a5 5 0 0 1 5 5v39H20a6 6 0 0 1-6-6V12a2 2 0 0 1 2-2Z" />
            <path d="M20 10v44M27 22h15M27 31h15M27 40h10" />
        </svg>
    `,
    gem: `
        <svg viewBox="0 0 64 64" aria-hidden="true">
            <path d="m13 23 9-12h20l9 12-19 31L13 23Z" />
            <path d="m13 23 19 8 19-8M22 11l10 20 10-20M32 31v23" />
        </svg>
    `,
    growth: `
        <svg viewBox="0 0 64 64" aria-hidden="true">
            <path d="M12 49h40" />
            <path d="m16 42 11-12 8 7 14-18" />
            <path d="M39 19h10v10" />
        </svg>
    `,
    bastion: `
        <svg viewBox="0 0 64 64" aria-hidden="true">
            <path d="m32 7 22 13v24L32 57 10 44V20L32 7Z" />
            <path d="m32 17 12 7v15l-12 7-12-7V24l12-7Z" />
            <path d="M32 17v29M20 24l24 15M44 24 20 39" />
        </svg>
    `,
    star: `
        <svg viewBox="0 0 64 64" aria-hidden="true">
            <path d="m32 7 7 17 18 2-14 12 4 18-15-9-15 9 4-18L7 26l18-2 7-17Z" />
            <circle cx="32" cy="32" r="7" />
        </svg>
    `,
    coin: `
        <svg viewBox="0 0 64 64" aria-hidden="true">
            <circle cx="32" cy="32" r="24" />
            <circle cx="32" cy="32" r="17" />
            <path d="M38 22h-9a6 6 0 0 0 0 12h6a6 6 0 0 1 0 12H25M32 17v30" />
        </svg>
    `,
    crown: `
        <svg viewBox="0 0 64 64" aria-hidden="true">
            <path d="m10 19 13 10 9-18 9 18 13-10-5 27H15l-5-27Z" />
            <path d="M16 52h32M20 39h24" />
            <circle cx="10" cy="18" r="3" />
            <circle cx="32" cy="9" r="3" />
            <circle cx="54" cy="18" r="3" />
        </svg>
    `
};

const badgeDefinitions = [
    {
        id: 'balance-100k',
        name: 'Өсөлтийн үр',
        icon: 'sprout',
        rarity: 'Common',
        rarityClass: 'common',
        rule: 'Цэвэр үлдэгдлээ 100,000 ₮-д хүргэх',
        progress: stats => `${Math.min(stats.balance, 100000).toLocaleString()} / 100,000 ₮`,
        progressPercent: stats => stats.balance / 100000 * 100,
        isEarned: stats => stats.balance >= 100000
    },
    {
        id: 'budget-3',
        name: 'Төсвийн хамгаалагч',
        icon: 'shield',
        rarity: 'Uncommon',
        rarityClass: 'uncommon',
        rule: 'Дууссан 3 сар дараалан бүх төсвийн хязгаарт багтах',
        progress: stats => `${Math.min(stats.budgetStreak, 3)} / 3 сар`,
        progressPercent: stats => stats.budgetStreak / 3 * 100,
        isEarned: stats => stats.budgetStreak >= 3
    },
    {
        id: 'transactions-10',
        name: 'Эхлэл',
        icon: 'ledger',
        rarity: 'Common',
        rarityClass: 'common',
        rule: 'Орлого, зарлагын нийт 10 гүйлгээг бүртгэх',
        progress: stats => `${Math.min(stats.transactionCount, 10)} / 10 гүйлгээ`,
        progressPercent: stats => stats.transactionCount / 10 * 100,
        isEarned: stats => stats.transactionCount >= 10
    },
    {
        id: 'saving-20',
        name: 'Хуримтлуулагч',
        icon: 'gem',
        rarity: 'Rare',
        rarityClass: 'rare',
        rule: 'Нийт орлогын 20%-иас дээшийг үлдэгдэл болгох',
        progress: stats => `${Math.min(stats.savingRate, 20).toFixed(0)} / 20%`,
        progressPercent: stats => stats.savingRate / 20 * 100,
        isEarned: stats => stats.savingRate >= 20
    },
    {
        id: 'positive-months-3',
        name: 'Эерэг урсгал',
        icon: 'growth',
        rarity: 'Epic',
        rarityClass: 'epic',
        rule: 'Дууссан 3 сар дараалан орлогоо зарлагаасаа өндөр байлгах',
        progress: stats => `${Math.min(stats.positiveMonthStreak, 3)} / 3 сар`,
        progressPercent: stats => stats.positiveMonthStreak / 3 * 100,
        isEarned: stats => stats.positiveMonthStreak >= 3
    },
    {
        id: 'balance-500k',
        name: 'Нөөцийн бамбай',
        icon: 'bastion',
        rarity: 'Epic',
        rarityClass: 'epic',
        rule: 'Цэвэр үлдэгдлээ 500,000 ₮-д хүргэх',
        progress: stats => `${Math.min(stats.balance, 500000).toLocaleString()} / 500,000 ₮`,
        progressPercent: stats => stats.balance / 500000 * 100,
        isEarned: stats => stats.balance >= 500000
    },
    {
        id: 'budget-6',
        name: 'Төсвийн эзэн',
        icon: 'star',
        rarity: 'Legendary',
        rarityClass: 'legendary',
        rule: 'Дууссан 6 сар тасралтгүй нэг ч төсөв хэтрүүлэхгүй байх',
        progress: stats => `${Math.min(stats.budgetStreak, 6)} / 6 сар`,
        progressPercent: stats => stats.budgetStreak / 6 * 100,
        isEarned: stats => stats.budgetStreak >= 6
    },
    {
        id: 'saving-40',
        name: 'Алтан хуримтлал',
        icon: 'coin',
        rarity: 'Legendary',
        rarityClass: 'legendary',
        rule: 'Нийт орлогын 40%-иас дээшийг цэвэр үлдэгдэл болгох',
        progress: stats => `${Math.min(stats.savingRate, 40).toFixed(0)} / 40%`,
        progressPercent: stats => stats.savingRate / 40 * 100,
        isEarned: stats => stats.savingRate >= 40
    },
    {
        id: 'balance-1m',
        name: 'Саяын титэм',
        icon: 'crown',
        rarity: 'Mythic',
        rarityClass: 'mythic',
        rule: 'Цэвэр үлдэгдлээ 1,000,000 ₮-д хүргэх',
        progress: stats => `${Math.min(stats.balance, 1000000).toLocaleString()} / 1,000,000 ₮`,
        progressPercent: stats => stats.balance / 1000000 * 100,
        isEarned: stats => stats.balance >= 1000000
    }
];

const rarityThemes = {
    common: { color: '#64748b', background: '#e2e8f0' },
    uncommon: { color: '#16a34a', background: '#dcfce7' },
    rare: { color: '#2563eb', background: '#dbeafe' },
    epic: { color: '#9333ea', background: '#f3e8ff' },
    legendary: { color: '#f59e0b', background: '#fef3c7' },
    mythic: { color: '#d946ef', background: '#fae8ff' }
};

document.addEventListener('DOMContentLoaded', async () => {
    
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        window.location.href = 'index.html';
        return;
    }

    currentUser = user;
    document.getElementById('user-email').textContent = user.email;

    await fetchTransactions(); 
    await fetchBudgets();
    renderBadges();
});

transactionForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Хуудас Refresh хийгдэхийг зогсооно

    // Талбаруудаас хэрэглэгчийн оруулсан утгуудыг уншиж авах
    const type = txTypeInput.value;
    const category = txCategoryInput.value;
    const amount = parseFloat(txAmountInput.value); // Текстийг тоо болгож хөрвүүлнэ
    const date = txDateInput.value;
    const description = txDescInput.value;

    // Гүйлгээ нэмэх гэж буй нэвтэрсэн хэрэглэгчийн мэдээллийг Supabase-ээс авах
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    // console.log(user)

    if (userError || !user) {
        alert("Сешн дууссан байна. Дахин нэвтэрнэ үү!");
        window.location.href = 'index.html';
        return;
    }

// --- (Формын утгуудыг авсны дараа, Insert хийхийн өмнөх хэсэг) ---
    
    // Хэрэв хийж буй гүйлгээ нь ЗАРЛАГА бол ТӨСӨВ ХЭТЭРСЭН ЭСЭХИЙГ ШАЛГАНА
    if (type === 'expense') {
        const currentMonthYear = date.substring(0, 7);

        const { data: budgetRows, error: budgetError } = await supabase
            .from('budgets')
            .select('id, limit_amount')
            .eq('user_id', user.id)
            .eq('category', category)
            .eq('month_year', currentMonthYear)
            .order('id', { ascending: false })
            .limit(1);

        if (budgetError) {
            alert("Төсөв шалгахад алдаа гарлаа: " + budgetError.message);
            return;
        }

        const budgetData = budgetRows?.[0];

        if (budgetData) {
            const limitAmount = Number(budgetData.limit_amount);

            const { data: pastExpenses, error: expenseError } = await supabase
                .from('transactions')
                .select('amount, date')
                .eq('user_id', user.id)
                .eq('type', 'expense')
                .eq('category', category)
                .gte('date', `${currentMonthYear}-01`)
                .lt('date', getNextMonth(currentMonthYear));

            if (expenseError) {
                alert("Зарлага шалгахад алдаа гарлаа: " + expenseError.message);
                return;
            }

            const totalPastExpense = (pastExpenses ?? []).reduce(
                (total, tx) => total + Number(tx.amount),
                0
            );
            const currentTotal = totalPastExpense + amount;

            if (currentTotal > limitAmount) {
                const proceed = confirm(
                    `Төсөв хэтэрнэ!\n\n` +
                    `Төсөв: ${limitAmount.toLocaleString()} ₮\n` +
                    `Шинэ нийт зарлага: ${currentTotal.toLocaleString()} ₮\n\n` +
                    `Үргэлжлүүлэх үү?`
                );

                if (!proceed) return;
            }
        }
    }

    const { error } = await supabase
        .from('transactions')
        .insert([
            {
                user_id: user.id,
                type: type,
                category: category,
                amount: amount,
                description: description,
                date: date
            }
        ]);

    if (error) {
        alert("Гүйлгээг хадгалахад алдаа гарлаа: " + error.message);
        console.error("Алдааны дэлгэрэнгүй:", error);
    } else {
        alert("Гүйлгээ амжилттай бүртгэгдлээ!");
        transactionForm.reset();
        await fetchTransactions();
    }
});

function getNextMonth(monthYear) {
    const [year, month] = monthYear.split('-').map(Number);
    const nextMonth = new Date(year, month, 1);

    return [
        nextMonth.getFullYear(),
        String(nextMonth.getMonth() + 1).padStart(2, '0'),
        '01'
    ].join('-');
}

// --- ТӨСӨВ ТОГТООХ ФОРМЫН ЛОГИК ---
const budgetForm = document.getElementById('budget-form');
const budgetCategoryInput = document.getElementById('budget-category');
const budgetAmountInput = document.getElementById('budget-amount');
const budgetMonthInput = document.getElementById('budget-month');

budgetForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Формоос өгөгдөл уншиж авах
    const category = budgetCategoryInput.value;
    const limitAmount = parseFloat(budgetAmountInput.value);
    const monthYear = budgetMonthInput.value; 
    // Нэвтэрсэн хэрэглэгчийг шалгах
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        alert("Сешн дууссан байна!");
        return;
    }

    // Supabase-ийн 'budgets' хүснэгт рүү хадгалах
    const { error } = await supabase
        .from('budgets')
        .insert([
            {
                user_id: user.id,
                category: category,
                limit_amount: limitAmount,
                month_year: monthYear
            }
        ]);

    if (error) {
        alert("Төсөв тогтооход алдаа гарлаа: " + error.message);
    } else {
        alert(`${monthYear} сарын ${category} ангилалд төсөв амжилттай тогтоогдлоо!`);
        budgetForm.reset();
        
        // Bootstrap Offcanvas цэсийг автоматаар хаах код
        const instance = bootstrap.Offcanvas.getInstance(document.getElementById('offcanvasBudget'));
        if (instance) instance.hide();
        
        // Доор бичих төсвийн жагсаалтыг шинэчлэх функцийг дуудна
        await fetchBudgets();
    }
});

async function fetchTransactions() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

    if (error) {
        console.error("Гүйлгээ уншихад алдаа гарлаа:", error.message);
        return;
    }

    let totalIncome = 0;
    let totalExpense = 0;

    // Ирсэн бүх гүйлгээнүүдийг нэг нэгээр нь шалгаж, орлого зарлагыг нэмнэ
    transactions.forEach(tx => {
        if (tx.type === 'income') {
            totalIncome += Number(tx.amount);  // Хэрэв орлого бол Нийт Орлого дээр нэмнэ
        } else if (tx.type === 'expense') {
            totalExpense += Number(tx.amount); // Хэрэв зарлага бол Нийт зарлага дээр нэмнэ
        }
    });

    // Үлдэгдэл баланс = Нийт Орлого - Нийт Зарлага
    const totalBalance = totalIncome - totalExpense;

    // Бодсон дүнг HTML карт руу бичих
    document.getElementById('total-balance').textContent = `${totalBalance.toLocaleString()} ₮`;
    document.getElementById('total-income').textContent = `${totalIncome.toLocaleString()} ₮`;
    document.getElementById('total-expense').textContent = `${totalExpense.toLocaleString()} ₮`;

    latestTransactions = transactions;
    renderTransactions(transactions);
    renderBadges();
}

function renderTransactions(transactions) {
    const listContainer = document.getElementById('transaction-list');
    
    // Хэрэв ямар ч гүйлгээ байхгүй бол хоосон байна гэсэн бичиг харуулна
    if (transactions.length === 0) {
        listContainer.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted py-4">
                    <i class="fa-solid fa-folder-open fs-3 d-block mb-2"></i>
                    Одоогоор ямар нэгэн гүйлгээ бүртгэгдээгүй байна.
                </td>
            </tr>
        `;
        return;
    }

    // Хүснэгтийг цэвэрлээд, датаг мөр мөрөөр нь залгах
    let htmlContent = '';
    
    transactions.forEach(tx => {
        // Орлого бол ногоон +, Зарлага бол улаан - тэмдэг тавих логик
        const isIncome = tx.type === 'income';
        const badgeColor = isIncome ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger';
        const typeText = isIncome ? 'Орлого' : 'Зарлага';
        const amountSign = isIncome ? '+' : '-';
        const amountColor = isIncome ? 'text-success' : 'text-danger';

        htmlContent += `
            <tr>
                <td>${tx.date}</td>
                <td><span class="badge bg-light text-dark shadow-sm border">${tx.category}</span></td>
                <td class="text-secondary fw-medium">${tx.description}</td>
                <td><span class="badge ${badgeColor}">${typeText}</span></td>
                <td class="text-end fw-bold ${amountColor}">${amountSign}${tx.amount.toLocaleString()} ₮</td>
                <td class="text-center">
                    <button class="btn btn-sm btn-link text-danger p-0" onclick="deleteTransaction('${tx.id}')">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    // Бэлдсэн  HTML мөрүүдээ хүснэгтийн tbody руу шууд шахаж оруулна
    listContainer.innerHTML = htmlContent;
}

window.deleteTransaction = async function(id) {
    // Хэрэглэгчээс үнэхээр устгах эсэхийг нь лавлаж асууна
    const confirmDelete = confirm("Та энэ гүйлгээг устгахдаа итгэлтэй байна уу?");
    
    if (!confirmDelete) {
        return; // Хэрэв "Үгүй" гэвэл устгах үйлдлийг цуцалж, функцээс гарна
    }

    try {
        // Supabase өгөгдлийн сангаас тухайн ID-тай гүйлгээг устгах
        const { error } = await supabase
            .from('transactions')
            .delete() // SQL-ийн DELETE команд
            .eq('id', id); // Зөвхөн энэ ID-тай мөрийг устга гэдэг шүүлтүүр

        if (error) {
            throw error; // Хэрэв алдаа гарвал catch хэсэг рүү шиднэ
        }

        alert("Гүйлгээ амжилттай устгагдлаа.");

        // Устгасны дараа дэлгэц дээрх хүснэгтийг шууд шинэчилж харуулна
        fetchTransactions();

    } catch (error) {
        alert("Гүйлгээ устгахад алдаа гарлаа: " + error.message);
        console.error("Устгах үеийн алдаа:", error);
    }
}

const btnLogout = document.getElementById('btn-logout');

// Товч дээр дарах үед ажиллах Event Listener залгах
btnLogout.addEventListener('click', async () => {
    // Хэрэглэгчээс үнэхээр гарах эсэхийг нь лавлаж асууна
    const confirmLogout = confirm("Та системээс гарахдаа итгэлтэй байна уу?");
    
    if (!confirmLogout) {
        return; // Хэрэв цуцалбал гарах үйлдлийг зогсооно
    }

    try {
        // Supabase-ийн системээс бүрмөсөн гаргах, сешн устгах тушаал
        const { error } = await supabase.auth.signOut();

        if (error) {
            throw error; // Хэрэв алдаа гарвал catch хэсэг рүү шиднэ
        }

        // Амжилттай гарсан тул нэвтрэх хуудас руу шууд шилжүүлнэ
        window.location.href = 'index.html';

    } catch (error) {
        alert("Системээс гарахад алдаа гарлаа: " + error.message);
        console.error("Logout алдаа:", error);
    }
});

// Хэрэглэгчийн тогтоосон төсвүүдийг уншиж, Offcanvas доор жагсаах функц
async function fetchBudgets() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: budgets, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .order('month_year', { ascending: false });

    if (error) {
        console.error("Төсөв уншихад алдаа гарлаа:", error.message);
        return;
    }

    latestBudgets = budgets ?? [];
    renderBadges();

    const budgetsContainer = document.getElementById('current-budgets-list');
    
    if (!budgets || budgets.length === 0) {
        budgetsContainer.innerHTML = `
            <h6 class="fw-bold text-dark mb-3">Одоогийн тогтоосон төсвүүд:</h6>
            <div class="text-center py-3 text-muted small bg-light rounded">Одоогоор төсөв тогтоогоогүй байна.</div>
        `;
        return;
    }

    let htmlContent = `<h6 class="fw-bold text-dark mb-3">Одоогийн тогтоосон төсвүүд:</h6>`;
    
    budgets.forEach(b => {
        htmlContent += `
            <div class="card p-2 mb-2 bg-light border-0 shadow-sm">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <span class="fw-bold small text-dark">${b.category}</span>
                        <span class="text-muted mx-1">•</span>
                        <span class="small text-secondary">${b.month_year}</span>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                        <span class="fw-bold text-primary small">${Number(b.limit_amount).toLocaleString()} ₮</span>
                        <button
                            type="button"
                            class="btn btn-sm btn-outline-danger"
                            onclick="deleteBudget('${b.id}')"
                            aria-label="Төсөв устгах"
                        >
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });

    budgetsContainer.innerHTML = htmlContent;
}

window.deleteBudget = async function(id) {
    const confirmDelete = confirm("Энэ төсвийг устгах уу?");
    if (!confirmDelete) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        alert("Сешн дууссан байна.");
        return;
    }

    const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) {
        alert("Төсөв устгахад алдаа гарлаа: " + error.message);
        return;
    }

    await fetchBudgets();
}

function getBadgeStats() {
    const income = latestTransactions
        .filter(tx => tx.type === 'income')
        .reduce((sum, tx) => sum + Number(tx.amount), 0);
    const expense = latestTransactions
        .filter(tx => tx.type === 'expense')
        .reduce((sum, tx) => sum + Number(tx.amount), 0);
    const balance = income - expense;
    const savingRate = income > 0 ? Math.max(0, (balance / income) * 100) : 0;

    return {
        balance,
        savingRate,
        budgetStreak: calculateBudgetStreak(),
        transactionCount: latestTransactions.length,
        positiveMonthStreak: calculatePositiveMonthStreak()
    };
}

function calculatePositiveMonthStreak() {
    const monthlyTotals = new Map();

    latestTransactions.forEach(tx => {
        const month = String(tx.date).substring(0, 7);
        if (!month) return;

        const totals = monthlyTotals.get(month) ?? { income: 0, expense: 0 };
        totals[tx.type] += Number(tx.amount);
        monthlyTotals.set(month, totals);
    });

    const currentMonth = new Date().toISOString().slice(0, 7);
    const months = [...monthlyTotals.keys()]
        .filter(month => month < currentMonth)
        .sort()
        .reverse();
    let streak = 0;
    let cursor = null;

    for (const month of months) {
        if (cursor && month !== getPreviousMonth(cursor)) break;

        const totals = monthlyTotals.get(month);
        if (totals.income <= totals.expense) break;

        streak++;
        cursor = month;
    }

    return streak;
}

function calculateBudgetStreak() {
    const budgetsByMonth = new Map();

    latestBudgets.forEach(budget => {
        if (!budgetsByMonth.has(budget.month_year)) {
            budgetsByMonth.set(budget.month_year, []);
        }
        budgetsByMonth.get(budget.month_year).push(budget);
    });

    const currentMonth = new Date().toISOString().slice(0, 7);
    const months = [...budgetsByMonth.keys()]
        .filter(month => month < currentMonth)
        .sort()
        .reverse();
    let streak = 0;
    let cursor = null;

    for (const month of months) {
        if (cursor && month !== getPreviousMonth(cursor)) break;

        const stayedWithinBudget = budgetsByMonth.get(month).every(budget => {
                const spent = latestTransactions
                    .filter(tx =>
                        tx.type === 'expense' &&
                        tx.category === budget.category &&
                        String(tx.date).startsWith(month)
                    )
                    .reduce((sum, tx) => sum + Number(tx.amount), 0);

                return spent <= Number(budget.limit_amount);
            });

        if (!stayedWithinBudget) break;
        streak++;
        cursor = month;
    }

    return streak;
}

function getPreviousMonth(monthYear) {
    const [year, month] = monthYear.split('-').map(Number);
    const previous = new Date(year, month - 2, 1);
    return `${previous.getFullYear()}-${String(previous.getMonth() + 1).padStart(2, '0')}`;
}

function getSelectedBadgeId() {
    if (!currentUser) return null;
    return localStorage.getItem(`selected-badge:${currentUser.id}`);
}

function saveSelectedBadge(id) {
    if (!currentUser) return;
    localStorage.setItem(`selected-badge:${currentUser.id}`, id);
}

function renderBadges() {
    if (!badgeList || !currentUser) return;

    const stats = getBadgeStats();
    const earnedBadges = badgeDefinitions.filter(badge => badge.isEarned(stats));
    let selectedId = getSelectedBadgeId();

    if (!earnedBadges.some(badge => badge.id === selectedId)) {
        selectedId = earnedBadges[0]?.id ?? null;
        if (selectedId) saveSelectedBadge(selectedId);
    }

    const selectedBadge = badgeDefinitions.find(badge => badge.id === selectedId);
    updateSelectedBadge(selectedBadge);

    const rarityOrder = {
        common: 1,
        uncommon: 2,
        rare: 3,
        epic: 4,
        legendary: 5,
        mythic: 6
    };
    const sortedBadges = [...badgeDefinitions].sort(
        (a, b) => rarityOrder[a.rarityClass] - rarityOrder[b.rarityClass]
    );

    badgeList.innerHTML = sortedBadges.map(badge => {
        const earned = badge.isEarned(stats);
        const selected = badge.id === selectedId;
        const theme = rarityThemes[badge.rarityClass];
        const progressPercent = Math.max(
            0,
            Math.min(100, badge.progressPercent(stats))
        );

        return `
            <div
                class="achievement-badge rarity-${badge.rarityClass} ${earned ? '' : 'is-locked'} ${selected ? 'is-selected' : ''}"
                style="--badge-color:${theme.color};--badge-bg:${theme.background}"
            >
                <span class="achievement-medal">
                    <span class="achievement-icon">${badgeIcons[badge.icon]}</span>
                </span>
                <div class="achievement-copy">
                    <div class="achievement-heading">
                        <div class="achievement-name">${badge.name}</div>
                        <span class="achievement-rarity">${badge.rarity}</span>
                    </div>
                    <div class="achievement-rule">${badge.rule}</div>
                    <div class="achievement-progress">
                        <span>${earned ? 'Амжилт нээгдсэн' : badge.progress(stats)}</span>
                        <span>${Math.round(progressPercent)}%</span>
                    </div>
                    <div class="achievement-progress-track" aria-hidden="true">
                        <span
                            class="achievement-progress-fill"
                            style="width:${progressPercent}%"
                        ></span>
                    </div>
                </div>
                <button
                    type="button"
                    class="achievement-select"
                    data-badge-id="${badge.id}"
                    ${earned ? '' : 'disabled'}
                >
                    ${selected ? 'Сонгосон' : earned ? 'Сонгох' : 'Түгжээтэй'}
                </button>
            </div>
        `;
    }).join('');
}

function updateSelectedBadge(badge) {
    const icon = badge ? badgeIcons[badge.icon] : badgeIcons.star;
    const name = badge?.name ?? 'Миний badge';
    const rarityClass = badge?.rarityClass ?? 'common';
    const badgeButton = document.getElementById('selected-badge-button');
    const activePreview = document.getElementById('active-badge-preview');

    document.getElementById('selected-badge-icon').innerHTML = icon;
    document.getElementById('selected-badge-name').textContent = name;
    document.getElementById('active-badge-icon').innerHTML = icon;
    document.getElementById('active-badge-name').textContent = badge?.name ?? 'Badge сонгоогүй';

    [badgeButton, activePreview].forEach(element => {
        element.className = element.className
            .replace(/\brarity-\S+/g, '')
            .trim();
        element.classList.add(`rarity-${rarityClass}`);
    });
}

badgeList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-badge-id]');
    if (!button || button.disabled) return;

    saveSelectedBadge(button.dataset.badgeId);
    renderBadges();
});

fetchTransactions();
