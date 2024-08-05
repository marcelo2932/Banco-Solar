import express from 'express';
import pool from './database/db.js'; 
import { engine } from 'express-handlebars';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();

const port = 3000;
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:3000`);
});

app.use(express.json());
app.use(express.static('public'));

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');

// Obtén la ruta absoluta del directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set('views', path.join(__dirname, 'views'));

// VER PAGINA
app.get('/', (req, res) => {
  res.render('home', { layout: false });
});

// NUEVO USUARIO
app.post('/usuario', async (req, res) => {
  const { nombre, balance } = req.body;
  try {
    const result = await pool.query('INSERT INTO usuarios (nombre, balance) VALUES ($1, $2) RETURNING *', [nombre, balance]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al crear usuario');
  }
});

// VER TODOS LOS USUARIOS
app.get('/usuarios', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM usuarios');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al obtener usuarios');
  }
});

// EDITAR USUARIO
app.put('/usuario', async (req, res) => {
  const { id, nombre, balance } = req.body;
  try {
    const result = await pool.query('UPDATE usuarios SET nombre = $1, balance = $2 WHERE id = $3 RETURNING *', [nombre, balance, id]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al actualizar usuario');
  }
});

// ELIMINAR USUARIO
app.delete('/usuario', async (req, res) => {
  const { id } = req.query;
  try {
    await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al eliminar usuario');
  }
});

// REALIZAR TRANSFERENCIA
app.post('/transferencia', async (req, res) => {
  const { emisor, receptor, monto } = req.body;
  try {
    await pool.query('BEGIN');
    const emisorResult = await pool.query('SELECT balance FROM usuarios WHERE id = $1', [emisor]);
    const emisorBalance = emisorResult.rows[0].balance;
    if (emisorBalance <= 0) {
      await pool.query('ROLLBACK');
      return res.status(400).json({ error: 'Usuario no tiene saldo suficiente para realizar la transferencia' });
    }
    if (emisorBalance < monto) {
      await pool.query('ROLLBACK');
      return res.status(400).json({ error: 'Saldo insuficiente para realizar la transferencia' });
    }
    await pool.query('UPDATE usuarios SET balance = balance - $1 WHERE id = $2', [monto, emisor]);
    await pool.query('UPDATE usuarios SET balance = balance + $1 WHERE id = $2', [monto, receptor]);
    const result = await pool.query('INSERT INTO transferencias (emisor, receptor, monto) VALUES ($1, $2, $3) RETURNING *', [emisor, receptor, monto]);
    await pool.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error(err);
    res.status(500).send('Error al realizar transferencia');
  }
});

// VER TRANSFERENCIAS
app.get('/transferencias', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        t.id, 
        u1.nombre AS emisor, 
        u2.nombre AS receptor, 
        t.monto, 
        t.fecha 
      FROM transferencias t
      INNER JOIN usuarios u1 ON t.emisor = u1.id
      INNER JOIN usuarios u2 ON t.receptor = u2.id
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al obtener transferencias');
  }
});