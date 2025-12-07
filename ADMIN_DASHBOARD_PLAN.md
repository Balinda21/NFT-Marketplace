# Admin Dashboard Features Plan

## Overview
Comprehensive admin dashboard for managing the NFT/Trading Marketplace platform.

## Dashboard Sections

### 1. **Dashboard Overview** (Main Page)
**Key Metrics Cards:**
- Total Users (Active/Inactive)
- Total Transactions Volume (24h, 7d, 30d)
- Total Orders (Pending/Active/Completed)
- Total Loans (Active/Overdue)
- Pending Approvals (Deposits/Withdrawals/Loans)
- Total Revenue/Profit
- Active Chat Sessions
- Unread Messages Count

**Charts:**
- User Growth (line chart)
- Transaction Volume Over Time
- Order Types Distribution (pie chart)
- Revenue Trends

**Recent Activity:**
- Latest registrations
- Recent transactions
- Recent orders
- Recent chat messages

---

### 2. **User Management**
**Features:**
- View all users (with search/filter)
- User details page:
  - Profile info
  - Account balance
  - Transaction history
  - Order history
  - Loan history
  - Chat sessions
  - Referral info
- Activate/Deactivate users
- View user wallets
- Edit user role (CUSTOMER/ADMIN)
- View user login history

**Actions:**
- Search by email, name, ID
- Filter by role, status, verification
- Export user list
- View user statistics

---

### 3. **Transaction Management**
**Features:**
- View all transactions (Deposits/Withdrawals)
- Filter by:
  - Type (DEPOSIT, WITHDRAWAL)
  - Status (PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED)
  - User
  - Date range
  - Network (ERC20, TRC20)
- Transaction details:
  - User info
  - Amount, currency, network
  - Wallet address
  - Transaction hash
  - Proof image (if uploaded)
  - Status history
- Approve/Reject transactions
- Mark as completed/failed
- View transaction statistics

**Actions:**
- Approve pending deposits
- Approve/reject withdrawals
- Process withdrawals
- View proof images
- Export transaction reports

---

### 4. **Order Management**
**Features:**
- View all orders (AI Quantification, Options, Contracts)
- Filter by:
  - Order type
  - Status (PENDING, ACTIVE, COMPLETED, CANCELLED, FAILED)
  - User
  - Symbol
  - Date range
- Order details:
  - User info
  - Order type and details
  - Amount, symbol, entry price
  - Direction (UP/DOWN for options)
  - Period/ROR (for options)
  - Leverage (for contracts)
  - Settlement info
  - Profit/loss
- Settle orders (especially option orders)
- View order statistics

**Actions:**
- Settle pending option orders
- Cancel orders
- View order history
- Export order reports
- View profit/loss analytics

---

### 5. **Loan Management**
**Features:**
- View all loans
- Filter by:
  - Status (PENDING, ACTIVE, COMPLETED, OVERDUE, CANCELLED)
  - User
  - Date range
- Loan details:
  - User info
  - Loan amount, term, interest rate
  - Total amount (principal + interest)
  - Repayment status
  - Due dates
  - Transaction history
- Approve/Reject loan requests
- Track repayments
- View overdue loans
- Loan statistics

**Actions:**
- Approve/reject loan requests
- Mark loans as completed
- View repayment history
- Send reminders for overdue loans
- Export loan reports

---

### 6. **Chat Management**
**Features:**
- View all chat sessions
- Filter by:
  - Status (OPEN, CLOSED, WAITING)
  - Assigned admin
  - User
  - Date range
- Chat session details:
  - User info
  - Assigned admin
  - Message history
  - Unread count
  - Last message time
- Assign admins to chats
- View/respond to messages
- Close chat sessions
- Chat statistics

**Actions:**
- Assign admin to unassigned chats
- View chat messages
- Respond to users
- Close resolved chats
- View chat analytics

---

### 7. **Content Management**
**Features:**
- **FAQ Management:**
  - View all FAQs
  - Create/Edit/Delete FAQs
  - Reorder FAQs
  - Preview FAQs
  
- **About Us Management:**
  - View all sections
  - Create/Edit/Delete sections
  - Reorder sections
  - Preview content

**Actions:**
- CRUD operations for FAQs
- CRUD operations for About Us
- Content preview
- Publish/unpublish content

---

### 8. **Referral Management**
**Features:**
- View all referrals
- Filter by referrer, referred user
- View referral statistics:
  - Total referrals
  - Total commissions paid
  - Top referrers
  - Referral conversion rate
- Referral details:
  - Referrer info
  - Referred user info
  - Commission earned
  - Total earnings
- Referral analytics

**Actions:**
- View referral tree
- Calculate commissions
- Export referral reports
- View top referrers

---

### 9. **Market Data Management**
**Features:**
- View cached market data
- Refresh market data
- View market data statistics
- Monitor market data updates
- View price history

**Actions:**
- Refresh market data cache
- View market data logs
- Monitor API status

---

### 10. **Settings & Configuration**
**Features:**
- System settings
- Admin user management
- API configuration
- Email/SMS settings
- Security settings
- View system logs

---

## Admin Dashboard Structure

```
Admin Dashboard
├── Dashboard (Overview)
├── Users
│   ├── All Users
│   ├── User Details
│   └── User Statistics
├── Transactions
│   ├── All Transactions
│   ├── Pending Approvals
│   └── Transaction Reports
├── Orders
│   ├── All Orders
│   ├── Pending Settlements
│   └── Order Analytics
├── Loans
│   ├── All Loans
│   ├── Pending Approvals
│   ├── Overdue Loans
│   └── Loan Reports
├── Chat
│   ├── All Sessions
│   ├── Unassigned Chats
│   └── Chat Analytics
├── Content
│   ├── FAQs
│   └── About Us
├── Referrals
│   ├── All Referrals
│   └── Referral Analytics
├── Market Data
│   └── Market Data Cache
└── Settings
    └── System Configuration
```

## API Endpoints Needed

### Dashboard Stats
- `GET /api/admin/dashboard/stats` - Get dashboard statistics
- `GET /api/admin/dashboard/activity` - Get recent activity

### Users
- `GET /api/admin/users` - Get all users (with pagination, filters)
- `GET /api/admin/users/:id` - Get user details
- `PUT /api/admin/users/:id` - Update user
- `PUT /api/admin/users/:id/status` - Activate/deactivate user
- `PUT /api/admin/users/:id/role` - Change user role

### Transactions
- `GET /api/admin/transactions` - Get all transactions
- `GET /api/admin/transactions/:id` - Get transaction details
- `PUT /api/admin/transactions/:id/approve` - Approve transaction
- `PUT /api/admin/transactions/:id/reject` - Reject transaction
- `PUT /api/admin/transactions/:id/complete` - Mark as completed

### Orders
- `GET /api/admin/orders` - Get all orders
- `GET /api/admin/orders/:id` - Get order details
- `POST /api/admin/orders/:id/settle` - Settle order
- `PUT /api/admin/orders/:id/cancel` - Cancel order

### Loans
- `GET /api/admin/loans` - Get all loans
- `GET /api/admin/loans/:id` - Get loan details
- `PUT /api/admin/loans/:id/approve` - Approve loan
- `PUT /api/admin/loans/:id/reject` - Reject loan

### Chat (already exists, but admin-specific)
- `GET /api/admin/chat/sessions` - Get all chat sessions (admin view)
- `POST /api/admin/chat/:sessionId/assign` - Assign admin (already exists)

### Content (already exists)
- All content endpoints already exist in `/api/content/*`

### Referrals
- `GET /api/admin/referrals` - Get all referrals
- `GET /api/admin/referrals/stats` - Get referral statistics

### Market Data
- `GET /api/admin/market-data` - Get market data cache
- `POST /api/admin/market-data/refresh` - Refresh cache

## UI/UX Considerations

1. **Sidebar Navigation** - Collapsible sidebar with all sections
2. **Top Bar** - User info, notifications, logout
3. **Search & Filters** - Global search and section-specific filters
4. **Data Tables** - Sortable, filterable tables with pagination
5. **Charts & Analytics** - Visual representation of data
6. **Responsive Design** - Works on desktop and tablet
7. **Dark Theme** - Match the app's dark theme
8. **Real-time Updates** - WebSocket for live updates
9. **Export Functionality** - Export reports to CSV/PDF
10. **Bulk Actions** - Select multiple items for bulk operations

## Priority Implementation

1. **Phase 1: Core Dashboard**
   - Dashboard overview with stats
   - User management
   - Basic transaction management

2. **Phase 2: Operations**
   - Order management
   - Loan management
   - Transaction approvals

3. **Phase 3: Support & Content**
   - Chat management
   - Content management
   - Referral management

4. **Phase 4: Analytics & Reports**
   - Advanced analytics
   - Export functionality
   - Market data management

