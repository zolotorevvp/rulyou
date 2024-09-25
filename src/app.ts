import express from 'express';
import {pool, createUsersTable} from './database.js';
import {User} from './models/user.js';
import mysql, {RowDataPacket} from "mysql2/promise";


const app = express();
app.use(express.json());

// POST /create
app.post('/create', async (req, res) => {
    const user: User = req.body;

    if (!user.full_name || !user.role || !user.efficiency) {
        return res.status(400).json({
            success: false,
            message: 'Missing required fields: full_name, role, efficiency'
        });
    }

    try {
        const [result] = await pool.query<mysql.ResultSetHeader>(
            'INSERT INTO users (full_name, role, efficiency) VALUES (?, ?, ?)',
            [user.full_name, user.role, user.efficiency]
        );

        if (result.affectedRows > 0) {
            return res.status(201).json({
                success: true,
                result: {id: result.insertId}
            });
        } else {
            return res.status(500).json({
                success: false,
                message: 'Failed to create user'
            });
        }
    } catch (error) {
        console.debug("ENDPOINT_CREATE", error);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        });
    }
});

// GET /get/:id
app.get('/get/:id', async (req, res) => {
    const userId = req.params.id;

    try {
        const {full_name, role, efficiency} = req.query;
        const values: any[] = [];
        let query = 'SELECT * FROM users WHERE id = ?';

        if (full_name) {
            query += ' AND full_name = ?';
            values.push(full_name as string);
        }
        if (role) {
            query += ' AND role = ?';
            values.push(role as string);
        }
        if (efficiency) {
            query += ' AND efficiency = ?';
            values.push(efficiency as string);
        }

        values.push(userId);

        const [results] = await pool.query<RowDataPacket[]>(query, values);

        if (results.length > 0) {
            return res.status(200).json({
                success: true,
                result: {users: results[0]},
            });
        } else {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }
    } catch (error) {
        console.debug("ENDPOINT_GET_ID", error);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
});

// GET /get
app.get('/get', async (req, res) => {
    try {
        const {full_name, role, efficiency} = req.query;
        const values: any[] = [];
        let query = 'SELECT * FROM users';
        const conditions: string[] = [];

        if (full_name) {
            conditions.push('full_name = ?');
            values.push(full_name as string);
        }
        if (role) {
            conditions.push('role = ?');
            values.push(role as string);
        }
        if (efficiency) {
            conditions.push('efficiency = ?');
            values.push(efficiency as string);
        }
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        const [results] = await pool.query<RowDataPacket[]>(query, values);

        return res.status(200).json({
            success: true,
            result: {users: results}
        });
    } catch (error) {
        console.debug("ENDPOINT_GET", error);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
});

// PATCH /update/:id
app.patch('/update/:id', async (req, res) => {
    const userId = req.params.id;
    const updateData = req.body;

    try {
        const values: any[] = [];
        let query = 'UPDATE users SET';
        const updateSet: string[] = [];

        if (updateData.full_name) {
            updateSet.push('full_name = ?');
            values.push(updateData.full_name);
        }
        if (updateData.role) {
            updateSet.push('role = ?');
            values.push(updateData.role);
        }
        if (updateData.efficiency) {
            updateSet.push('efficiency = ?');
            values.push(updateData.efficiency);
        }

        values.push(userId);

        query += ' ' + updateSet.join(', ');
        query += ' WHERE id = ?';

        const [result] = await pool.query<mysql.ResultSetHeader>(query, values);

        if (result.affectedRows > 0) {
            const [updatedUser] = await pool.query<RowDataPacket[]>(
                'SELECT * FROM users WHERE id = ?',
                [userId]
            );
            return res.status(200).json({
                success: true,
                result: updatedUser[0],
            });
        } else {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }
    } catch (error) {
        console.debug("ENDPOINT_UPDATE", error);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
});

// DELETE /delete/:id
app.delete('/delete/:id', async (req, res) => {
    const userId = req.params.id;

    try {

        const [userCard] = await pool.query<RowDataPacket[]>('SELECT * FROM users WHERE id = ?', [userId]);
        const [result] = await pool.query<mysql.ResultSetHeader>('DELETE FROM users WHERE id = ?', [userId]);
        if (result.affectedRows > 0) {
            return res.status(200).json({
                success: true,
                result: userCard[0]
            });
        } else {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }
    } catch (error) {
        console.debug("ENDPOINT_DELETE_ID", error);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
});

// DELETE /delete
app.delete('/delete', async (_req, res) => {
    try {
        await pool.query<RowDataPacket[]>('DELETE FROM users');
        return res.status(200).json({
            success: true
        });
    } catch (error) {
        console.debug("ENDPOINT_DELETE", error);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    console.log(`Server running on port ${PORT}`);
    await createUsersTable();
});
