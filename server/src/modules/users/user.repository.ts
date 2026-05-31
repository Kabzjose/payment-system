import { db } from '../../config/db';
import { User } from '../../types';

export const userRepository = {

  async findByEmail(email: string): Promise<User | null> {
    const { rows } = await db.query<User>(
      'SELECT * FROM users WHERE email = $1 LIMIT 1',
      [email]
    );
    return rows[0] ?? null;
  },

  async findById(id: string): Promise<User | null> {
    const { rows } = await db.query<User>(
      'SELECT * FROM users WHERE id = $1 LIMIT 1',
      [id]
    );
    return rows[0] ?? null;
  },

  async create(data: {
    email: string;
    name: string;
    password_hash: string;
  }): Promise<User> {
    const { rows } = await db.query<User>(
      `INSERT INTO users (email, name, password_hash)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [data.email, data.name, data.password_hash]
    );
    return rows[0];
  },

};