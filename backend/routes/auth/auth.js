const express = require('express');
const bcrypt = require ('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../../db.js');
require('dotenv').config();

const router = express.Router();


router.post('/register', async (req, res) => {
    const { nome, email, senha, data_nasc } = req.body;

    try {
        // Verificação se o email já está cadastrado
        const userExists = await pool.query('SELECT * FROM app_biblia.Usuario WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: 'Email já cadastrado' });
        }

        // Hash da senha, transfrormando-a em um hash seguro
        const saltRounds = 10;
        const senhaHash = await bcrypt.hash(senha, saltRounds);

        // Inserção do novo usuário no banco de dados
        const result = await pool.query(
            'INSERT INTO app_biblia.Usuario (nome, email, senha_hash, data_nasc) VALUES ($1, $2, $3, $4) RETURNING id_usuario',
            [nome, email, senhaHash, data_nasc]
        );

        res.status(201).json({ message: 'Usuário cadastrado com sucesso', userId: result.rows[0].id_usuario });
    } catch (err) {  
        console.error(err);
        res.status(500).json({ error: 'Erro ao cadastrar usuário' });
    }
});

// Endpoint para login do usuário
router.post('/login', async (req, res) => {
    const { email, senha } = req.body;

    try {
        const user = await pool.query('SELECT * FROM app_biblia.usuario WHERE email = $1', [email]);
        if (user.rows.length === 0) {
            return res.status(400).json({ error: 'Credenciais inválidas' });
        }

        const usuario = user.rows[0];
        const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
        if (!senhaValida) {
            return res.status(400).json({ error: 'Credenciais inválidas' });
        }

        const token = jwt.sign (
            { id_usuario: usuario.id_usuario, email: usuario.email},
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        await pool.query('UPDATE app_biblia.Usuario SET ultimo_login = NOW () WHERE id_usuario = $1', [usuario.id_usuario]);
        res.json({ message: 'Login bem-sucedido', token});
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao autenticar usuário'});
    }
});
// Middleware para verificar o token JWT


module.exports = router;
