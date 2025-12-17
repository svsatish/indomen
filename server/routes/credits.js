import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { logAuditEvent } from '../middleware/auditLog.js';
import { createNotification } from './notifications.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const creditsPath = path.join(__dirname, '../data/credits.json');
const usersPath = path.join(__dirname, '../data/users.json');

// Get ALL users' credit/debit balances (admin only - for bookkeeping)
router.get('/all-balances', requireAdmin, async (req, res) => {
    try {
        const creditsData = await fs.readFile(creditsPath, 'utf-8');
        const credits = JSON.parse(creditsData);

        const usersData = await fs.readFile(usersPath, 'utf-8');
        const users = JSON.parse(usersData);

        // Group credits by user
        const userBalances = {};

        // Initialize with all users
        users.forEach(user => {
            if (user.role !== 'admin') {
                userBalances[user.id] = {
                    userId: user.id,
                    userName: user.name,
                    userEmail: user.email,
                    creditBalance: 0,
                    debitBalance: 0,
                    netBalance: 0,
                    activeCredits: [],
                    activeDebits: [],
                    history: []
                };
            }
        });

        // Process all credit/debit entries
        credits.forEach(entry => {
            if (!userBalances[entry.userId]) {
                // User might have been deleted, but still has credit history
                userBalances[entry.userId] = {
                    userId: entry.userId,
                    userName: entry.userName || 'Unknown User',
                    userEmail: entry.userEmail || 'Unknown',
                    creditBalance: 0,
                    debitBalance: 0,
                    netBalance: 0,
                    activeCredits: [],
                    activeDebits: [],
                    history: []
                };
            }

            const userBal = userBalances[entry.userId];

            // Add to history
            userBal.history.push({
                id: entry.id,
                type: entry.type,
                originalAmount: entry.originalAmount,
                remainingAmount: entry.remainingAmount,
                reason: entry.reason,
                status: entry.status,
                createdAt: entry.createdAt,
                relatedOrderId: entry.relatedOrderId
            });

            // Calculate active balances
            if (entry.status === 'active' && entry.remainingAmount > 0) {
                if (entry.type === 'credit') {
                    userBal.creditBalance += entry.remainingAmount;
                    userBal.activeCredits.push(entry);
                } else if (entry.type === 'debit') {
                    userBal.debitBalance += entry.remainingAmount;
                    userBal.activeDebits.push(entry);
                }
            }
        });

        // Calculate net balances and convert to array
        const balancesList = Object.values(userBalances).map(user => {
            user.netBalance = user.creditBalance - user.debitBalance;
            user.history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            return user;
        });

        // Sort by those with outstanding balances first
        balancesList.sort((a, b) => {
            // Users with outstanding debits first
            if (a.debitBalance > 0 && b.debitBalance === 0) return -1;
            if (b.debitBalance > 0 && a.debitBalance === 0) return 1;
            // Then users with credits
            if (a.creditBalance > 0 && b.creditBalance === 0) return -1;
            if (b.creditBalance > 0 && a.creditBalance === 0) return 1;
            // Then alphabetically
            return a.userName.localeCompare(b.userName);
        });

        // Calculate totals
        const totals = {
            totalCreditsOutstanding: balancesList.reduce((sum, u) => sum + u.creditBalance, 0),
            totalDebitsOutstanding: balancesList.reduce((sum, u) => sum + u.debitBalance, 0),
            usersWithCredits: balancesList.filter(u => u.creditBalance > 0).length,
            usersWithDebits: balancesList.filter(u => u.debitBalance > 0).length
        };

        res.json({
            users: balancesList,
            totals
        });
    } catch (error) {
        console.error('Error fetching all balances:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get user's credit/debit balance
router.get('/balance', requireAuth, async (req, res) => {
    try {
        const data = await fs.readFile(creditsPath, 'utf-8');
        const credits = JSON.parse(data);

        const userCredits = credits.filter(c => c.userId === req.session.userId && c.status === 'active');

        // Calculate credit balance (positive - money customer can use)
        const creditBalance = userCredits
            .filter(c => c.type === 'credit')
            .reduce((sum, c) => sum + c.remainingAmount, 0);

        // Calculate debit balance (negative - money customer owes)
        const debitBalance = userCredits
            .filter(c => c.type === 'debit')
            .reduce((sum, c) => sum + c.remainingAmount, 0);

        // Net balance (positive = credit, negative = owes money)
        const netBalance = creditBalance - debitBalance;

        res.json({
            netBalance: netBalance,
            creditBalance: creditBalance,
            debitBalance: debitBalance,
            credits: userCredits.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        });
    } catch (error) {
        console.error('Error fetching credit balance:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Issue credit or debit (admin only)
router.post('/issue', requireAdmin, async (req, res) => {
    try {
        const { userId, userEmail, userName, amount, reason, orderId, type } = req.body;

        if (!userId || !amount || amount <= 0) {
            return res.status(400).json({ error: 'User ID and positive amount required' });
        }

        if (!type || !['credit', 'debit'].includes(type)) {
            return res.status(400).json({ error: 'Type must be "credit" or "debit"' });
        }

        const data = await fs.readFile(creditsPath, 'utf-8');
        const credits = JSON.parse(data);

        const newEntry = {
            id: `${type.toUpperCase()}_${Date.now()}`,
            userId,
            userEmail,
            userName,
            type, // 'credit' or 'debit'
            originalAmount: parseFloat(amount),
            remainingAmount: parseFloat(amount),
            reason: reason || (type === 'credit' ? 'Store credit' : 'Additional charges'),
            relatedOrderId: orderId || null,
            status: 'active', // 'active', 'used', 'expired', 'voided'
            issuedBy: req.session.userId,
            issuedByName: req.session.userName,
            createdAt: new Date().toISOString(),
            expiresAt: null, // Can add expiration logic if needed
            usageHistory: []
        };

        credits.push(newEntry);
        await fs.writeFile(creditsPath, JSON.stringify(credits, null, 2));

        // Log audit event
        await logAuditEvent(req, type === 'credit' ? 'CREDIT_ISSUED' : 'DEBIT_ISSUED', {
            entryId: newEntry.id,
            userId,
            userName,
            amount,
            type,
            reason,
            orderId
        });

        // Create notification for user
        const amountValue = parseFloat(amount);
        const notificationMessage = type === 'credit'
            ? `You have received a store credit of $${amountValue.toFixed(2)}. ${reason ? `Reason: ${reason}` : ''}`
            : `You have been charged $${amountValue.toFixed(2)}. ${reason ? `Reason: ${reason}` : ''}`;

        try {
            await createNotification(
                userId,
                userEmail,
                userName,
                type,
                notificationMessage,
                parseFloat(amount),
                newEntry.id
            );
        } catch (notifError) {
            console.error('Failed to create notification:', notifError);
            // Don't fail the whole operation if notification creation fails
        }

        res.status(201).json(newEntry);
    } catch (error) {
        console.error('Error issuing credit/debit:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Apply credit to order OR pay down debit balance (during checkout)
router.post('/apply', requireAuth, async (req, res) => {
    try {
        const { amount, orderId } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Valid amount required' });
        }

        const data = await fs.readFile(creditsPath, 'utf-8');
        const credits = JSON.parse(data);

        // Get user's active credits (money they can use)
        const userCredits = credits.filter(
            c => c.userId === req.session.userId && c.type === 'credit' && c.status === 'active' && c.remainingAmount > 0
        ).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); // Oldest first (FIFO)

        const totalAvailableCredit = userCredits.reduce((sum, c) => sum + c.remainingAmount, 0);

        if (totalAvailableCredit < amount) {
            return res.status(400).json({
                error: 'Insufficient credit balance',
                available: totalAvailableCredit
            });
        }

        // Apply credits (FIFO - First In First Out)
        let remainingToApply = amount;
        const appliedCredits = [];

        for (const credit of userCredits) {
            if (remainingToApply <= 0) break;

            const creditIndex = credits.findIndex(c => c.id === credit.id);
            const amountToUse = Math.min(credit.remainingAmount, remainingToApply);

            credits[creditIndex].remainingAmount -= amountToUse;
            credits[creditIndex].usageHistory.push({
                amount: amountToUse,
                orderId,
                usedAt: new Date().toISOString()
            });

            if (credits[creditIndex].remainingAmount === 0) {
                credits[creditIndex].status = 'used';
            }

            appliedCredits.push({
                creditId: credit.id,
                amount: amountToUse
            });

            remainingToApply -= amountToUse;
        }

        await fs.writeFile(creditsPath, JSON.stringify(credits, null, 2));

        // Log audit event
        await logAuditEvent(req, 'CREDIT_APPLIED', {
            orderId,
            amount,
            appliedCredits
        });

        res.json({
            success: true,
            appliedAmount: amount,
            appliedCredits,
            newBalance: totalAvailableCredit - amount
        });
    } catch (error) {
        console.error('Error applying credit:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Pay debit balance (customer paying what they owe)
router.post('/pay-debit', requireAuth, async (req, res) => {
    try {
        const { amount, paymentId, paymentMethod } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Valid amount required' });
        }

        const data = await fs.readFile(creditsPath, 'utf-8');
        const credits = JSON.parse(data);

        // Get user's active debits (money they owe)
        const userDebits = credits.filter(
            c => c.userId === req.session.userId && c.type === 'debit' && c.status === 'active' && c.remainingAmount > 0
        ).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); // Oldest first (FIFO)

        const totalDebt = userDebits.reduce((sum, c) => sum + c.remainingAmount, 0);

        if (amount > totalDebt) {
            return res.status(400).json({
                error: 'Payment amount exceeds debt balance',
                debtBalance: totalDebt
            });
        }

        // Pay down debits (FIFO - First In First Out)
        let remainingToPay = amount;
        const paidDebits = [];

        for (const debit of userDebits) {
            if (remainingToPay <= 0) break;

            const debitIndex = credits.findIndex(c => c.id === debit.id);
            const amountToPay = Math.min(debit.remainingAmount, remainingToPay);

            credits[debitIndex].remainingAmount -= amountToPay;
            credits[debitIndex].usageHistory.push({
                amount: amountToPay,
                paymentId,
                paymentMethod,
                paidAt: new Date().toISOString()
            });

            if (credits[debitIndex].remainingAmount === 0) {
                credits[debitIndex].status = 'paid';
            }

            paidDebits.push({
                debitId: debit.id,
                amount: amountToPay
            });

            remainingToPay -= amountToPay;
        }

        await fs.writeFile(creditsPath, JSON.stringify(credits, null, 2));

        // Log audit event
        await logAuditEvent(req, 'DEBIT_PAID', {
            amount,
            paymentId,
            paymentMethod,
            paidDebits
        });

        res.json({
            success: true,
            paidAmount: amount,
            paidDebits,
            newDebtBalance: totalDebt - amount
        });
    } catch (error) {
        console.error('Error paying debit:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all credits (admin only)
router.get('/all', requireAdmin, async (req, res) => {
    try {
        const data = await fs.readFile(creditsPath, 'utf-8');
        const credits = JSON.parse(data);

        res.json(credits.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    } catch (error) {
        console.error('Error fetching credits:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Void/cancel credit (admin only)
router.put('/:id/void', requireAdmin, async (req, res) => {
    try {
        const data = await fs.readFile(creditsPath, 'utf-8');
        const credits = JSON.parse(data);

        const creditIndex = credits.findIndex(c => c.id === req.params.id);

        if (creditIndex === -1) {
            return res.status(404).json({ error: 'Credit not found' });
        }

        credits[creditIndex].status = 'voided';
        credits[creditIndex].voidedAt = new Date().toISOString();
        credits[creditIndex].voidedBy = req.session.userId;

        await fs.writeFile(creditsPath, JSON.stringify(credits, null, 2));

        await logAuditEvent(req, 'CREDIT_VOIDED', {
            creditId: req.params.id,
            userId: credits[creditIndex].userId
        });

        res.json(credits[creditIndex]);
    } catch (error) {
        console.error('Error voiding credit:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;

