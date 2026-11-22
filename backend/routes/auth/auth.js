const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const pool = require('../../db.js');
const verifyToken = require('./authMiddleware.js');
require('dotenv').config();

const router = express.Router();

const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const MIN_PASSWORD = 6;
const TOKEN_DAYS = 15;

const normalizeEmail = (email) => (typeof email === 'string' ? email.trim().toLowerCase() : '');
const cleanText = (value) => (typeof value === 'string' ? value.trim() : '');

/** Limitador com resposta em JSON no mesmo formato de erro das rotas. */
function limiter({ windowMinutes, max, message, keyGenerator }) {
    return rateLimit({
        windowMs: windowMinutes * 60 * 1000,
        limit: max,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        keyGenerator,
        handler: (req, res) => res.status(429).json({ error: message }),
    });
}

// Login: por IP + e-mail, para que um ataque a uma conta não bloqueie os outros usuários do mesmo IP
const loginLimiter = limiter({
    windowMinutes: 15,
    max: 10,
    message: 'Muitas tentativas de login. Aguarde 15 minutos e tente de novo.',
    keyGenerator: (req) => `${req.ip}|${normalizeEmail(req.body?.email)}`,
});
const registerLimiter = limiter({
    windowMinutes: 60,
    max: 20,
    message: 'Muitos cadastros a partir desta rede. Tente de novo mais tarde.',
});
const deleteLimiter = limiter({
    windowMinutes: 15,
    max: 5,
    message: 'Muitas tentativas. Aguarde 15 minutos e tente de novo.',
    keyGenerator: (req) => `${req.ip}|${req.usuario?.id_usuario}`,
});

router.post('/register', registerLimiter, async (req, res) => {
    const nome = cleanText(req.body?.nome);
    const sobrenome = cleanText(req.body?.sobrenome);
    const email = normalizeEmail(req.body?.email);
    const senha = req.body?.senha;

    if (!nome || nome.length > 80 || sobrenome.length > 80) {
        return res.status(400).json({ error: 'Informe um nome válido.' });
    }
    if (!EMAIL_REGEX.test(email) || email.length > 254) {
        return res.status(400).json({ error: 'Informe um e-mail válido.' });
    }
    if (typeof senha !== 'string' || senha.length < MIN_PASSWORD || senha.length > 128) {
        return res.status(400).json({ error: `A senha deve ter entre ${MIN_PASSWORD} e 128 caracteres.` });
    }

    try {
        const userExists = await pool.query(
            'SELECT 1 FROM bible_study_app.usuario WHERE lower(email) = $1',
            [email]
        );
        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: 'Email já cadastrado' });
        }

        const senhaHash = await bcrypt.hash(senha, 10);
        const result = await pool.query(
            'INSERT INTO bible_study_app.usuario (nome, sobrenome, email, senha_hash) VALUES ($1, $2, $3, $4) RETURNING id_usuario',
            [nome, sobrenome, email, senhaHash]
        );

        res.status(201).json({ message: 'Usuário cadastrado com sucesso', userId: result.rows[0].id_usuario });
    } catch (err) {
        console.error('[auth] Erro ao cadastrar:', err.message);
        res.status(500).json({ error: 'Erro ao cadastrar usuário' });
    }
});

router.post('/login', loginLimiter, async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const senha = req.body?.senha;

    if (!email || typeof senha !== 'string' || !senha) {
        return res.status(400).json({ error: 'Informe e-mail e senha.' });
    }

    try {
        // lower(email): contas antigas podem ter sido gravadas com maiúsculas
        const user = await pool.query(
            'SELECT id_usuario, nome, email, senha_hash FROM bible_study_app.usuario WHERE lower(email) = $1 ORDER BY id_usuario LIMIT 1',
            [email]
        );
        const usuario = user.rows[0];
        const senhaValida = usuario ? await bcrypt.compare(senha, usuario.senha_hash) : false;
        if (!senhaValida) {
            return res.status(400).json({ error: 'Credenciais inválidas' });
        }

        const token = jwt.sign(
            { id_usuario: usuario.id_usuario, email: usuario.email, nome: usuario.nome },
            process.env.JWT_SECRET,
            { expiresIn: `${TOKEN_DAYS}d` }
        );

        await pool.query('UPDATE bible_study_app.usuario SET ultimo_login = NOW() WHERE id_usuario = $1', [usuario.id_usuario]);
        res.json({ message: 'Login bem-sucedido', token, expiresIn: TOKEN_DAYS * 24 * 60 * 60 });
    } catch (err) {
        console.error('[auth] Erro no login:', err.message);
        res.status(500).json({ error: 'Erro ao autenticar usuário' });
    }
});

/**
 * Exclusão da conta pelo próprio usuário (exigência do Google Play e da LGPD).
 * Pede a senha de novo; as tabelas ligadas ao usuário são apagadas em cascata.
 */
router.delete('/account', verifyToken, deleteLimiter, async (req, res) => {
    const senha = req.body?.senha;
    if (typeof senha !== 'string' || !senha) {
        return res.status(400).json({ error: 'Digite sua senha para confirmar.' });
    }

    try {
        const { rows } = await pool.query(
            'SELECT senha_hash FROM bible_study_app.usuario WHERE id_usuario = $1',
            [req.usuario.id_usuario]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'Conta não encontrada.' });

        const senhaValida = await bcrypt.compare(senha, rows[0].senha_hash);
        if (!senhaValida) return res.status(400).json({ error: 'Senha incorreta.' });

        await pool.query('DELETE FROM bible_study_app.usuario WHERE id_usuario = $1', [req.usuario.id_usuario]);
        console.log(`[auth] Conta ${req.usuario.id_usuario} excluída pelo usuário`);
        res.json({ message: 'Conta excluída.' });
    } catch (err) {
        console.error('[auth] Erro ao excluir conta:', err.message);
        res.status(500).json({ error: 'Não foi possível excluir a conta. Tente de novo.' });
    }
});

module.exports = router;
