-- Expenditure Table (from Expenditure sheet)
CREATE TABLE IF NOT EXISTS expenditure (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT,
    description TEXT,
    type TEXT,
    amount REAL DEFAULT 0,
    mode TEXT,
    remark TEXT,
    estimation REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Admissions Table (from Admission 2025 + 2024 sheets)
CREATE TABLE IF NOT EXISTS admissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT,
    class TEXT,
    status TEXT DEFAULT 'Active',
    student_name TEXT NOT NULL,
    parent_name TEXT,
    primary_phone TEXT,
    alternate_phone TEXT,
    email TEXT,
    join_date TEXT,
    end_date TEXT,
    fee_registered REAL DEFAULT 0,
    book_fee REAL DEFAULT 0,
    admission_fee REAL DEFAULT 0,
    term1 REAL DEFAULT 0,
    term2 REAL DEFAULT 0,
    term3 REAL DEFAULT 0,
    others REAL DEFAULT 0,
    total_paid REAL DEFAULT 0,
    fee_balance REAL DEFAULT 0,
    followup TEXT,
    year INTEGER NOT NULL DEFAULT 2025,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Salaries Table (from Salaries sheet)
CREATE TABLE IF NOT EXISTS salaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT,
    staff_name TEXT,
    phone TEXT,
    working_month TEXT,
    salary_paid_date TEXT,
    salary_agreed REAL DEFAULT 0,
    working_days INTEGER DEFAULT 0,
    leaves INTEGER DEFAULT 0,
    salary_to_pay REAL DEFAULT 0,
    advance REAL DEFAULT 0,
    salary_paid REAL DEFAULT 0,
    status TEXT DEFAULT 'Pending',
    remarks TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Employees Table (from Employees sheet)
CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    emp_no TEXT UNIQUE,
    type TEXT,
    status TEXT DEFAULT 'Active',
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    joining_date TEXT,
    end_date TEXT,
    salary_agreed REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Investments Table (from Investment sheet)
CREATE TABLE IF NOT EXISTS investments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sno INTEGER,
    date TEXT,
    investor TEXT,
    amount REAL DEFAULT 0,
    remarks TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Summer Camp Table (from Summer Camp 2025 + 2024 sheets)
CREATE TABLE IF NOT EXISTS summer_camp (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id TEXT,
    status TEXT DEFAULT 'Active',
    student_name TEXT NOT NULL,
    parent_name TEXT,
    phone TEXT,
    email TEXT,
    joining_date TEXT,
    end_date TEXT,
    admission_type TEXT DEFAULT 'Summer Camp',
    payment_period TEXT DEFAULT 'Monthly',
    fee_registered REAL DEFAULT 0,
    paid REAL DEFAULT 0,
    fee_balance REAL DEFAULT 0,
    year INTEGER NOT NULL DEFAULT 2025,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Enquiries Table (from Preschool Enquiries sheet)
CREATE TABLE IF NOT EXISTS enquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT,
    name TEXT,
    phone TEXT,
    email TEXT,
    student_age TEXT,
    interested_class TEXT,
    address TEXT,
    remarks TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
