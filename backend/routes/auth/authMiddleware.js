const jwt = require('jsonwebtoken');
const pool = require('../../db.js');

const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: 'Token não fornecido.' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Formato de token inválido.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decoded; // Adiciona os dados do usuário decodificados à requisição

        // Opcional: Verificar se o usuário ainda existe no banco de dados
        const user = await pool.query('SELECT id_usuario, email FROM app_biblia.Usuario WHERE id_usuario = $1', [decoded.id_usuario]);
        if (user.rows.length === 0) {
            return res.status(401).json({ message: 'Usuário não encontrado.' });
        }

        // Renovação do token (se necessário e desejado)
        // Para implementar a renovação de 15 dias, precisaria de uma lógica mais sofisticada
        // que envolva o `ultimo_login` do banco de dados e a expiração do token atual.
        // Por enquanto, apenas valida e passa adiante.

        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expirado.' });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Token inválido.' });
        } else {
            console.error('Erro na verificação do token:', error);
            return res.status(500).json({ message: 'Falha na autenticação.' });
        }
    }
};

module.exports = verifyToken;

