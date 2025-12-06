import prisma from '@/config/prisma';
import { TransactionType, TransactionStatus, OrderType, OrderStatus, LoanStatus, ChatStatus } from '@prisma/client';
import ApiError from '@/utils/ApiError';
import { ERROR_CODES } from '@/utils/errorCodes';
import status from 'http-status';

/**
 * Get dashboard statistics
 */
export const getDashboardStats = async () => {
  const [
    totalUsers,
    activeUsers,
    totalTransactions,
    pendingTransactions,
    totalOrders,
    activeOrders,
    totalLoans,
    activeLoans,
    overdueLoans,
    openChatSessions,
    unreadMessages,
  ] = await Promise.all([
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { isActive: true, isVerified: true } }),
    prisma.transaction.count({ where: { isActive: true } }),
    prisma.transaction.count({
      where: {
        isActive: true,
        status: { in: [TransactionStatus.PENDING, TransactionStatus.PROCESSING] },
      },
    }),
    prisma.order.count({ where: { isActive: true } }),
    prisma.order.count({
      where: {
        isActive: true,
        status: OrderStatus.ACTIVE,
      },
    }),
    prisma.loan.count({ where: { isActive: true } }),
    prisma.loan.count({
      where: {
        isActive: true,
        status: LoanStatus.ACTIVE,
      },
    }),
    prisma.loan.count({
      where: {
        isActive: true,
        status: LoanStatus.OVERDUE,
      },
    }),
    prisma.chatSession.count({
      where: {
        isActive: true,
        status: ChatStatus.OPEN,
      },
    }),
    prisma.chatMessage.count({
      where: {
        isActive: true,
        isRead: false,
      },
    }),
  ]);

  // Calculate total transaction volume (last 24h, 7d, 30d)
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [volume24h, volume7d, volume30d] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        isActive: true,
        status: TransactionStatus.COMPLETED,
        createdAt: { gte: last24h },
      },
      _sum: {
        amount: true,
      },
    }),
    prisma.transaction.aggregate({
      where: {
        isActive: true,
        status: TransactionStatus.COMPLETED,
        createdAt: { gte: last7d },
      },
      _sum: {
        amount: true,
      },
    }),
    prisma.transaction.aggregate({
      where: {
        isActive: true,
        status: TransactionStatus.COMPLETED,
        createdAt: { gte: last30d },
      },
      _sum: {
        amount: true,
      },
    }),
  ]);

  // Calculate total revenue (from completed orders)
  const totalRevenue = await prisma.order.aggregate({
    where: {
      isActive: true,
      status: OrderStatus.COMPLETED,
      profit: { not: null },
    },
    _sum: {
      profit: true,
    },
  });

  return {
    users: {
      total: totalUsers,
      active: activeUsers,
    },
    transactions: {
      total: totalTransactions,
      pending: pendingTransactions,
      volume24h: volume24h._sum.amount || 0,
      volume7d: volume7d._sum.amount || 0,
      volume30d: volume30d._sum.amount || 0,
    },
    orders: {
      total: totalOrders,
      active: activeOrders,
    },
    loans: {
      total: totalLoans,
      active: activeLoans,
      overdue: overdueLoans,
    },
    chat: {
      openSessions: openChatSessions,
      unreadMessages,
    },
    revenue: {
      total: totalRevenue._sum.profit || 0,
    },
  };
};

/**
 * Get recent activity
 */
export const getRecentActivity = async (limit: number = 10) => {
  const [recentUsers, recentTransactions, recentOrders, recentChats] = await Promise.all([
    prisma.user.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
      },
    }),
    prisma.transaction.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      } as any,
    }),
    prisma.order.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      } as any,
    }),
    prisma.chatSession.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      } as any,
    }),
  ]);

  return {
    recentUsers,
    recentTransactions,
    recentOrders,
    recentChats,
  };
};

/**
 * Get all users (admin)
 */
export const getAllUsers = async (filters: {
  search?: string;
  role?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
}) => {
  const { search, role, isActive, page = 1, limit = 50 } = filters;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { firstName: { contains: search, mode: 'insensitive' } },
      { lastName: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (role) {
    where.role = role;
  }

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        isVerified: true,
        accountBalance: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            transactions: true,
            orders: true,
            loans: true,
          } as any,
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get user details (admin)
 */
export const getUserDetails = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      wallets: {
        where: { isActive: true },
      },
      transactions: {
        take: 10,
        orderBy: { createdAt: 'desc' },
      },
      orders: {
        take: 10,
        orderBy: { createdAt: 'desc' },
      },
      loans: {
        take: 10,
        orderBy: { createdAt: 'desc' },
      },
      referrals: {
        include: {
          referred: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      _count: {
        select: {
          transactions: true,
          orders: true,
          loans: true,
          referrals: true,
        } as any,
      },
    },
  });

  if (!user) {
    throw new ApiError(status.NOT_FOUND, 'User not found', ERROR_CODES.USER_NOT_FOUND);
  }

  return user;
};

/**
 * Update user (admin)
 */
export const updateUser = async (
  userId: string,
  data: {
    firstName?: string;
    lastName?: string;
    role?: string;
    isActive?: boolean;
    isVerified?: boolean;
  }
) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: data as any,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      isVerified: true,
      updatedAt: true,
    },
  });

  return user;
};

/**
 * Get all transactions (admin)
 */
export const getAllTransactions = async (filters: {
  type?: TransactionType;
  status?: TransactionStatus;
  userId?: string;
  page?: number;
  limit?: number;
}) => {
  const { type, status, userId, page = 1, limit = 50 } = filters;
  const skip = (page - 1) * limit;

  const where: any = {
    isActive: true,
  };

  if (type) where.transactionType = type;
  if (status) where.status = status;
  if (userId) where.userId = userId;

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        wallet: {
          select: {
            id: true,
            address: true,
            network: true,
          },
        },
      } as any,
    }),
    prisma.transaction.count({ where }),
  ]);

  return {
    transactions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Update transaction status (admin)
 */
export const updateTransactionStatus = async (
  transactionId: string,
  status: TransactionStatus
) => {
  const transaction = await prisma.transaction.update({
    where: { id: transactionId },
    data: { status },
    include: {
      user: {
        select: {
          id: true,
          email: true,
        },
      },
    } as any,
  });

  return transaction;
};

/**
 * Get all orders (admin)
 */
export const getAllOrders = async (filters: {
  type?: OrderType;
  status?: OrderStatus;
  userId?: string;
  symbol?: string;
  page?: number;
  limit?: number;
}) => {
  const { type, status, userId, symbol, page = 1, limit = 50 } = filters;
  const skip = (page - 1) * limit;

  const where: any = {
    isActive: true,
  };

  if (type) where.orderType = type;
  if (status) where.status = status;
  if (userId) where.userId = userId;
  if (symbol) where.symbol = symbol;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      } as any,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get all loans (admin)
 */
export const getAllLoans = async (filters: {
  status?: LoanStatus;
  userId?: string;
  page?: number;
  limit?: number;
}) => {
  const { status, userId, page = 1, limit = 50 } = filters;
  const skip = (page - 1) * limit;

  const where: any = {
    isActive: true,
  };

  if (status) where.status = status;
  if (userId) where.userId = userId;

  const [loans, total] = await Promise.all([
    prisma.loan.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      } as any,
    }),
    prisma.loan.count({ where }),
  ]);

  return {
    loans,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Update loan status (admin)
 */
export const updateLoanStatus = async (loanId: string, status: LoanStatus) => {
  const loan = await prisma.loan.update({
    where: { id: loanId },
    data: { status },
    include: {
      user: {
        select: {
          id: true,
          email: true,
        },
      },
    } as any,
  });

  return loan;
};

/**
 * Get referral statistics
 */
export const getReferralStats = async () => {
  const [totalReferrals, totalCommissions, topReferrers] = await Promise.all([
    prisma.referral.count({ where: { isActive: true } }),
    prisma.referral.aggregate({
      where: { isActive: true },
      _sum: {
        totalEarnings: true,
      },
    }),
    prisma.referral.groupBy({
      by: ['referrerId'],
      where: { isActive: true },
      _sum: {
        totalEarnings: true,
      },
      _count: {
        referredUserId: true,
      },
      orderBy: {
        _sum: {
          totalEarnings: 'desc',
        },
      },
      take: 10,
    }),
  ]);

  // Get referrer details
  const referrerIds = topReferrers.map((r) => r.referrerId);
  const referrers = await prisma.user.findMany({
    where: { id: { in: referrerIds } },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  });

  const topReferrersWithDetails = topReferrers.map((ref) => {
    const referrer = referrers.find((r) => r.id === ref.referrerId);
    return {
      referrer: referrer || null,
      totalReferrals: ref._count.referredUserId,
      totalEarnings: ref._sum.totalEarnings || 0,
    };
  });

  return {
    totalReferrals,
    totalCommissions: totalCommissions._sum.totalEarnings || 0,
    topReferrers: topReferrersWithDetails,
  };
};

