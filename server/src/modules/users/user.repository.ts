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

  async updateById(
    id: string,
    data: Partial<{ name: string; email: string; password_hash: string }>
  ): Promise<User | null> {
    const fields = Object.keys(data) as (keyof typeof data)[];
    if (fields.length === 0) return userRepository.findById(id);

    // Dynamically build: SET name = $2, email = $3, updated_at = NOW()
    const setClauses = [
      ...fields.map((f, i) => `${f} = $${i + 2}`),
      'updated_at = NOW()',
    ].join(', ');
    const values = fields.map((f) => data[f]);

    const { rows } = await db.query<User>(
      `UPDATE users SET ${setClauses} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    return rows[0] ?? null;
  },

};